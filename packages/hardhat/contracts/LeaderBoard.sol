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
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract LeaderBoardStorageV1 {
    struct Item {
        address submitter;
        string imageUrl;
        string clickUrl;
        string title;
        string description;
        uint upVotes;
        uint startTime;
        uint endTime;
        uint id;
    }

    CountersUpgradeable.Counter public ItemIdCounter;
    mapping(uint => Item) public itemsById;
    uint[] public itemIds;

    uint[97] __gap;
}

contract LeaderBoardV1 is LeaderBoardStorageV1, Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    event ItemAdded(address submitter, string title, uint itemId);
    event ItemUpVoted(uint itemId, address upVoter, uint upVoteCount);
    event ItemUpdated(address submitter, string title, uint itemId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __Ownable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function addItem(Item memory _item) public onlyOwner whenNotPaused{
        ItemIdCounter.increment();
        _item.upVotes = 0;
        _item.submitter = msg.sender;
        _item.id = ItemIdCounter.current();
        itemsById[ItemIdCounter.current()] = _item;
        itemIds.push(ItemIdCounter.current());
        emit ItemAdded(_item.submitter, _item.title, ItemIdCounter.current());
    }

    function itemsCount() public view returns(uint){
        return ItemIdCounter.current();
    }

    function getAllItemIds() public view returns(uint[] memory){
        return itemIds;
    }

    function getItemsByIdHashAsArray() public view returns(Item[] memory)  {
        Item[] memory foo = new Item[](itemsCount());
        for(uint i=1;i<= itemsCount();i++){
            foo[i-1] = itemsById[i];
        }
        return foo;
    }

    function getAllItems() public view returns(Item[] memory){
        Item[] memory foo = new Item[](itemIds.length);
        for(uint i=0;i<itemIds.length;i++){
            foo[i] = itemsById[itemIds[i]];
        }
        return foo;
    }

    function upVoteItem(uint _itemId) public whenNotPaused{
        Item storage item = itemsById[_itemId];
        item.upVotes = item.upVotes + 1;
        emit ItemUpVoted(_itemId, msg.sender, item.upVotes);
    }

    function updateItem(uint _itemId, Item memory _item) public onlyOwner whenNotPaused {
        Item storage item = itemsById[_itemId];
        item.clickUrl = _item.clickUrl;
        item.imageUrl = _item.imageUrl;
        item.description = _item.description;
        item.title = _item.title;
        item.endTime = _item.endTime;
        item.startTime = _item.startTime;
        emit ItemUpdated(msg.sender, item.title, _itemId);
    }

    function timestamp() public view returns(uint) {
        return block.timestamp;
    }

    function startOfToday() view public returns(uint){
        return block.timestamp - (block.timestamp % (24*60*60));
    }

    function doEmptyTransaction() external { }

    receive() external payable {}
    fallback() external payable {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}