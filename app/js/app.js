const Web3 = require("web3");
const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
const $ = require("jquery");

require("file-loader?name=../index.html!../index.html");

// Not to forget our built contract
const etherDrawBetaJson = require("../../build/contracts/EtherDrawBeta.json");


//TODO uncomment before testnet
//// Supports Mist, and other wallets that provide 'web3'.
//if (typeof web3 !== 'undefined') {
//    // Use the Mist/wallet/Metamask provider.
//    window.web3 = new Web3(web3.currentProvider);


//    //test net
//    web3.version.network == 3


//} else {
    // Your preferred fallback.
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
//}


Promise.promisifyAll(web3.eth, { suffix: "Promise" });
Promise.promisifyAll(web3.version, { suffix: "Promise" });

//Load up the contract interface
const EtherDrawBeta = truffleContract(etherDrawBetaJson);
EtherDrawBeta.setProvider(web3.currentProvider);



//The ratio used to scale up the canvas
const INTIAL_ZOOM = 4;
var zoomRatio = INTIAL_ZOOM;


//Load the Contract on page load, and display some user info
window.addEventListener('load', function() {
    return web3.eth.getAccountsPromise()
        .then(accounts => {
            if (accounts.length == 0) {
                throw new Error("No account with which to transact");
            }
            window.account = accounts[0];
            $('#etherUserAddress').text(window.account)

            web3.eth.getBalance(window.account,((err, result) => {
                $('#etherBalance').text(web3.fromWei(result.toString(10), "ether"));
            }));

            return web3.version.getNetworkPromise();
        })
        .then(function(network) {
            return EtherDrawBeta.deployed();
        })
        .then(instance => {
            window.contract = instance;

            //Get the initial canvas state from the contract
            //TODO


            //Initially zoom in on canvas a little bit
            $('#canvas').css("transform", "scale(" + zoomRatio + ")");


            //Watch for any changes and update the UI
            window.contract.LogPixelChange({},{fromBlock: 0})
            .watch(function(err, response) {
                var xCoordinate = response.args.x;
                var yCoordinate = response.args.y;
                var pixelFilled = response.args.on;

                var canvas = $('#canvas')[0];
                if (canvas.getContext) {
                    var ctx = canvas.getContext('2d');
                    if(pixelFilled){
                        ctx.fillRect(xCoordinate, yCoordinate, 1, 1)
                    } else{
                        ctx.clearRect(xCoordinate, yCoordinate, 1, 1)
                    }
                }
            });
        })
        .catch(console.error);
});



$('#zoomIn').click(function () {
    var canvas = $('#canvas');
    if(zoomRatio < 20){
        zoomRatio += 1 ;
    }

    canvas.css("transform", "scale(" + zoomRatio + ")");
});

$('#zoomOut').click(function () {
    var canvas = $('#canvas');
    if(zoomRatio > 1){
        zoomRatio -= 1 ;
    }
    canvas.css("transform", "scale(" + zoomRatio + ")");
});


$('#canvas').click(function (e) {
    var canvasOffset = $('#canvas').offset();

    //Subtract the two absolute coordinates to get relative coordinates, divide by scale to get back to 100x100 pixels
    //subtract 1 because we have a 1 pixel border.
    var canvasX = Math.floor((e.pageX - canvasOffset.left) / zoomRatio) - 1;
    var canvasY = Math.floor((e.pageY - canvasOffset.top) / zoomRatio) - 1;
    $('#selectedPixelX').text(canvasX);
    $('#selectedPixelY').text(canvasY);

    $('#submitButton').prop('disabled', false);
});



$('#submitButton').click(function () {
    var canvasX = $('#selectedPixelX').text();
    var canvasY = $('#selectedPixelY').text();

    var canvas = $('#canvas')[0];
    var ctx = canvas.getContext('2d');
    var pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;

    var isFilled = (pixel[3] === 255);
    //If the pixel is already filled, we clear it.
    var newPixelVal = !isFilled;

    window.contract.setPixel.sendTransaction(canvasX,canvasY, newPixelVal, {from: window.account});

    $('#submitButton').prop('disabled', true);
});



function drawCanvas() {
    //window.contract.canvas.call(10,10)
    //.then(pixel => {
//        console.log("pixel value is " + pixel);
//        if(pixel){
            var canvas = $('#canvas')[0];
            if (canvas.getContext) {
                var ctx = canvas.getContext('2d');
                ctx.fillRect(0, 0, 1, 1);
                ctx.fillRect(1, 1, 1, 1);
                ctx.fillRect(2, 2, 1, 1);
                ctx.fillRect(3, 3, 1, 1);
                ctx.fillRect(4, 4, 1, 1);
                ctx.fillRect(5, 5, 1, 1);
                ctx.fillRect(6, 6, 1, 1);
                ctx.fillRect(7, 7, 1, 1);
                ctx.fillRect(8, 8, 1, 1);
                ctx.fillRect(9, 9, 1, 1);
            }
       // }
    //});
}

