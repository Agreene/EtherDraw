pragma solidity ^0.4.13;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    if (newOwner != address(0)) {
      owner = newOwner;
    }
  }
}


contract EtherDrawBeta is Ownable {
    
    function EtherDrawBeta() public {
        cooldown = 0;
        spamFee = 0;
        feeIncreaseRate = 100;
    }

    //Fallback function
    function() public payable {
    }

    // We use a 100 x 100 =10,000 pixel canvas
    // each pixel is 1 bit.
    // 40 * 256 bits/byte = 10,240 pixels. There's 240 leftover we won't use.
    uint256[40] private canvas;

    //The number of blocks users must wait between setting pixels (otherwise they must pay a fee)
    uint cooldown;

    //An extra fee required if users are submitting pixels too fast. Applied to every request past the first one
    //that is made within the cooldown period.  If the cooldown period passes the fee goes back to 0.
    uint spamFee;

    //The multiplier applied to the spamFee if several requests are made in a row.  This is exponential,
    //so if the rate was 200, the fee doubles each time
    //So for 4 sequential requests the first is free, second is spamFee, third is 2 * spamFee, fourth is 4 * spamFee
    uint feeIncreaseRate;

    //the pixel coordinates and whether it is on or off
    event LogPixelChange(uint x, uint y, bool on);


    //x: the x coordinates
    //y: the y coordinates
    //color: true if the pixel should be black, false for white
    function setPixel(uint x, uint y, bool color) external {
        require(x < 100);
        require(y < 100);

        uint bitNumber = (100 * y) + x;

        //The bit's index in the array
        uint index = bitNumber / 256;

        //the bit's offset within the uint256 element
        uint offset = bitNumber % 256;

        //mask that represents the position of the specific bit we want to change
        uint mask = (1 << (255 - offset));

        //set the pixel
        if(color){
            //Bitwise OR with  00010000 ...etc
            //This will leave all other bits as they are and set only the one we want.
            canvas[index] = canvas[index] | (mask);
        }
        //clear the pixel
        else {
            //Bitwise AND with 11101111 ...etc
            //This will leave all other bits as they are and clear only the one we want.
            canvas[index] = canvas[index] & (~mask);
        }

        LogPixelChange(x,y,color);
    }



    //True if the pixel is black, false if it's white
    function getPixel(uint x, uint y) external constant returns (bool) {
        require(x < 100);
        require(y < 100);

        uint bitNumber = (100 * y) + x;

        //The bit's index in the array
        uint index = bitNumber / 256;

        //the bit's offset within the uint256 element
        uint offset = bitNumber % 256;

        //mask that represents the position of the specific bit
        uint mask = (1 << (255 - offset));

        return (mask & canvas[index] != 0) ;
    }


    function getCanvas() external constant returns(uint256[40]) {
        return canvas;
    }

    function ownerSetCooldown(uint _cooldown) public onlyOwner{
        cooldown = _cooldown;
    }

    function ownerSetSpamFee(uint _spamFee) public onlyOwner{
        spamFee = _spamFee;
    }

    function ownerSetFeeIncreaseRate(uint _feeIncreaseRate) public onlyOwner {
        feeIncreaseRate = _feeIncreaseRate;
    }


    function ownerWithdraw(uint amount) public onlyOwner {
        require(amount <= this.balance);
        owner.transfer(amount);
    }

    
}


