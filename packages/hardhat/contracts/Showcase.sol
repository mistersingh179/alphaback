pragma solidity >=0.8.14;
// SPDX-License-Identifier: UNLICENSED
/*
 * (c) Copyright 2022 Masalsa, Inc., all rights reserved.
  You have no rights, whatsoever, to fork, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
  By using this file/contract, you agree to the Customer Terms of Service at https://alphaback.xyz/tos.html
  THE SOFTWARE IS PROVIDED AS-IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  This software is Experimental, use at your own risk!
 */

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Showcase is Ownable, Multicall {
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    EnumerableMap.AddressToUintMap private membersWithPayoutDate;

    IERC20 public usdcContract;
    mapping(uint => Promotion) public promotions;
    mapping(uint => uint) public dayToCost;
    uint[] public promotionDates;

    uint public defaultCost = 99_990_000 ; // this is $99.99 for USDC
    uint constant public installBasePercentage = 70; // 70%

    event PromotionAdded(Promotion promotion);

    struct Promotion {
        address promoter;
        address nftContractAddress;
        uint nftTokenId;
        string clickThruUrl;
        uint amount;
        uint date;
        string title;
        string subTitle;
        string networkName;
        string imageUrl;
        uint memberCount;
    }

    constructor(address _usdcAddress){
        usdcContract = IERC20(_usdcAddress);
    }

    function getMultiplePromotions(uint[] memory dates) public view returns(Promotion[] memory){
        uint numOfPromotions = dates.length;
        console.log("you asked for promotion count: ", numOfPromotions);
        Promotion[] memory promos = new Promotion[](numOfPromotions);
        for(uint i=0;i<numOfPromotions;i++){
//            console.log("looking up promotions for date: ");
//            console.log(dates[i]);
            promos[i] = promotions[dates[i]];
//            console.log(promos[i].promoter);
        }
        return promos;
   }

   function getMultipleDayCosts(uint[] memory dates) public view returns(uint[] memory){
       uint numOfDates = dates.length;
       console.log("you asked for dates count: ", numOfDates);
       uint[] memory costs = new uint[](numOfDates);
       for(uint i=0;i<numOfDates;i++){
           costs[i] = dayToCost[dates[i]];
       }
       return costs;
   }

    function updatePromotion(Promotion memory _promotion) public {
        Promotion storage existingPromo = promotions[_promotion.date];
        require((msg.sender == owner()) || (msg.sender == existingPromo.promoter),
            "you do not have rights to update this promotion");
        existingPromo.nftContractAddress = _promotion.nftContractAddress;
        existingPromo.nftTokenId = _promotion.nftTokenId;
        existingPromo.clickThruUrl = _promotion.clickThruUrl;
        existingPromo.title = _promotion.title;
        existingPromo.subTitle = _promotion.subTitle;
        existingPromo.networkName = _promotion.networkName;
        existingPromo.imageUrl = _promotion.imageUrl;
    }

    function addPromotion(Promotion memory _promotion) public {
        require(promotions[_promotion.date].promoter == address(0), "promotion is not available");

        uint amount = defaultCost;
        if(dayToCost[_promotion.date] > 0){
            amount = dayToCost[_promotion.date];
        }
        if(owner() == msg.sender){
            amount = 0;
        }
//        require(_promotion.date >= startOfToday(), "promotion day is in the past");
        require(usdcContract.allowance(msg.sender, address(this)) >= amount, "you need to approve contract to spend 1000+ usdc");
        require(usdcContract.balanceOf(msg.sender) >= amount, "you don't have enough usdc");
        require(usdcContract.transferFrom(msg.sender, address(this), amount), "transfer of usdc to contract failed");

        usdcContract.transfer(owner(), (amount*(100-installBasePercentage))/100);
        emit PromotionAdded(_promotion);
        _promotion.amount = amount;
        _promotion.memberCount = membersWithPayoutDate.length();
       _promotion.promoter = msg.sender;
        promotions[_promotion.date] = _promotion;
        promotionDates.push(_promotion.date);
    }

    function withdraw(uint amount) public onlyOwner{
        console.log("*** in withdraw: ");
        console.log(amount);
        uint contractsBal = usdcContract.balanceOf(address(this));
        console.log(contractsBal);
        require(amount <= contractsBal, "not enough balance");
        usdcContract.transfer(msg.sender, amount);
    }

    function withdrawEth(uint amount) public onlyOwner{
        console.log("*** in withdrawEth: ");
        console.log(amount);

        (bool sent, bytes memory data) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to withdraw Eth");
    }

    // to support receiving ETH by default
    receive() external payable {}
    fallback() external payable {}

    function setDefaultCost(uint newCost) public onlyOwner {
        defaultCost = newCost;
    }

    function setDayCost(uint date, uint newCost) public onlyOwner {
        dayToCost[date] = newCost;
    }

    function addMembers(address[] memory _members, uint[] memory _payoutDates) public onlyOwner(){
        console.log("*** in adMembbers");
        console.log(_members.length);
        console.log(_payoutDates.length);
        require(_members.length == _payoutDates.length, "members & payoutDates do not have same length");
        for(uint i=0;i<_members.length;i++){
            console.log(_members[i]);
            console.log(_payoutDates[i]);
            membersWithPayoutDate.set(_members[i], _payoutDates[i]);
            console.log("done");
        }
        resetMemberCountOfAllFuturePromotions();
    }

    function resetMemberCountOfAllFuturePromotions() private{
        uint startOfTomorrow = block.timestamp - (block.timestamp % (24*60*60)) + (24*60*60);
        console.log("startOfTomorrow: ", startOfTomorrow);
        uint currentMemberCount = membersCount();
        console.log(currentMemberCount);
        if(promotionDates.length >= 1){
            console.log(promotionDates.length);
            for(uint i=promotionDates.length;i>0;i--){
                if(promotions[promotionDates[i-1]].date >= startOfTomorrow){
                    if(promotions[promotionDates[i-1]].memberCount != currentMemberCount){
                        promotions[promotionDates[i-1]].memberCount = currentMemberCount;
                    }
                }else{
                    break;
                }
            }
        }
    }

    function removeMembers(address[] memory _members) public onlyOwner(){
        for(uint i=0;i<_members.length;i++){
            membersWithPayoutDate.remove(_members[i]);
        }
        resetMemberCountOfAllFuturePromotions();
    }

    function memberBalanceHistory(address _memberAddress, uint[] memory promoDates) public view returns(string[] memory){
        uint lastPayoutDate = membersWithPayoutDate.get(_memberAddress);
        string[] memory messages = new string[](promoDates.length);
        for(uint i=0;i<promoDates.length;i++){
            Promotion memory tempPromo = promotions[promoDates[i]];
            console.log(tempPromo.date, tempPromo.amount);

            if(tempPromo.amount == 0){
                messages[i] = "skipping promo date as no money there";
                continue;
            }
            if(tempPromo.date <= lastPayoutDate){
                messages[i] = "skipping promo date as before or equal to lastPayoutDate";
                continue;
            }
            if(tempPromo.date > block.timestamp) {
                messages[i] = "skipping promo date as after now";
                continue;
            }
            if(tempPromo.memberCount == 0){
                messages[i] = "skipping promo as it has no members";
                continue;
            }
            uint amt = ((tempPromo.amount * installBasePercentage) / 100) / tempPromo.memberCount;
            messages[i] = Strings.toString(amt);
        }
        return messages;
    }

    function memberBalance(address _memberAddress, uint[] memory promoDates) public view returns(uint, uint){
        uint amount = 0;

        uint lastPayoutDate = membersWithPayoutDate.get(_memberAddress);
        uint newLastPayoutDate = lastPayoutDate;
        console.log("*** lastPayoutDate: ");
        console.log(lastPayoutDate);
        console.log("*** block.timestamp: ", block.timestamp);

        for(uint i=0;i<promoDates.length;i++){
            Promotion memory tempPromo = promotions[promoDates[i]];
            console.log(tempPromo.date, tempPromo.amount);

            if(promoDates[i] > newLastPayoutDate){
                newLastPayoutDate = promoDates[i];
            }

            if(tempPromo.amount == 0){
                console.log("skipping promo date as no money there");
                continue;
            }
            if(tempPromo.date <= lastPayoutDate){
                console.log("skipping promo date as before or equal to lastPayoutDate");
                continue;
            }
            if(tempPromo.date > block.timestamp) {
                console.log("skipping promo date as after now");
                console.log("more");
                continue;
            }
            if(tempPromo.memberCount == 0){
                console.log("skipping promo as it has no members");
                continue;
            }
            uint amt = ((tempPromo.amount * installBasePercentage) / 100) / tempPromo.memberCount;
            amount += amt;
            console.log("adding amount: ", amt);
        }
        return (amount, newLastPayoutDate);
    }

    function areMembersPresent(address[] memory _addresses) public view returns(bool[] memory){
        bool[] memory results = new bool[](_addresses.length);
        for(uint i=0;i<_addresses.length;i++){
            results[i] = membersWithPayoutDate.contains(_addresses[i]);
        }
        return results;
    }

    function memberAtIndex(uint _index) public view returns(address, uint){
        (address _memberAddress, uint _lastPayoutDate) = membersWithPayoutDate.at(_index);
        return (_memberAddress, _lastPayoutDate);
    }

    function membersCount() public view returns(uint) {
        return membersWithPayoutDate.length();
    }

    function getMembersLastPayoutDate(address[] memory _addresses) public view returns(uint[] memory){
        uint[] memory results = new uint[](_addresses.length);
        for(uint i=0;i<_addresses.length;i++){
            results[i] = membersWithPayoutDate.get(_addresses[i]);
        }
        return results;
    }

    function memberWithdrawBalance(uint[] memory promoDates) public{
        (uint amount, uint newLastPayoutDate) = memberBalance(msg.sender, promoDates);

        membersWithPayoutDate.set(msg.sender, newLastPayoutDate);
        usdcContract.transfer(msg.sender, amount);
    }

    function timestamp() public view returns(uint) {
        return block.timestamp;
    }

    function startOfToday() view public returns(uint){
        return block.timestamp - (block.timestamp % (24*60*60));
    }

    function doEmptyTransaction() external { }

    function selfDestruct() onlyOwner external {
        try usdcContract.balanceOf(address(this)) returns (uint bal) {
            try usdcContract.transfer(msg.sender, bal) {
                console.log('transfered usdcContract');
            }catch {
                console.log('unable to transfer usdcContract');
            }
        }catch{
            console.log('unable to get balance');
        }
        selfdestruct(payable(msg.sender));
    }
}
