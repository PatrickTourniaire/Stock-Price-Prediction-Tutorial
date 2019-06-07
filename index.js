const iexUrl = 'https://api.iextrading.com/1.0';

const net = new brain.recurrent.LSTMTimeStep({
    inputSize: 4,
    hiddenLayers: [8,8],
    outputSize: 4
});
const request = new XMLHttpRequest();

const scaleDown = (step) => {
    return {
        open: step['open'] / 166,
        high: step['high'] / 166,
        low: step['low'] / 166,
        close: step['close'] / 166
    }
}

const scaleUp = (step) => {
   return {
        open: step['open'] * 166,
        high: step['high'] * 166,
        low: step['low'] * 166,
        close: step['close'] * 166
    } 
}

const getTrainData = (data) => {
    var train = [];
    for (const n in data) {
        const node = {
            open: data[n]['open'],
            high: data[n]['high'],
            low: data[n]['low'],
            close: data[n]['close']
        }
        
        train.push(node);
    }
    
    return train.map(scaleDown);
}

const getHistoricalData = (ticker, period, callback) => {
    const url = iexUrl + '/stock/' + ticker + '/chart/' + period;
    request.open('GET', url, true);
    request.onload = function() {
        let data = JSON.parse(this.response);
        getTrainData(data)
        callback((data != null) ? null : true, getTrainData(data));
    }
    
    request.send();
}
getHistoricalData('aapl', '2y', function(err, response) {
    if (!err) {
        const trainData = [
            response.slice(0, 5),
            response.slice(5, 10),
            response.slice(10, 15),
            response.slice(15, 20),
        ];
        console.log(trainData[1].map(scaleUp));
        
        net.train(trainData, {
            learningRate: 0.005,
            errorThresh: 0.02,
            //log: (stats) => console.log(stats)
        });
        
        console.log(scaleUp(net.run(trainData[0])));
    }
});
