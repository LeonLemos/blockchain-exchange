const { ethers } = require("hardhat");
const config = require('../src/config.json')

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait = (seconds) =>{
    const milliseconds = seconds*1000
    return new Promise(resolve=> setTimeout(resolve, milliseconds))
}

async function main() {

    //Fetch Accounts from wallet - these are unlocked
    const accounts = await ethers.getSigners()

    //Fetch network
    const { chainId } =await ethers.provider.getNetwork()
    console.log('Using chainId:', chainId)

    //Fetch Tokens 
    const Dapp = await ethers.getContractAt('Token',config[chainId].Dapp.address)
    console.log(`Dapp Token fetched : ${Dapp.address}`)
    const mETH = await ethers.getContractAt('Token',config[chainId].mETH.address)
    console.log(`mETH Token fetched : ${mETH.address}`)
    const mDAI = await ethers.getContractAt('Token',config[chainId].mDAI.address)
    console.log(`mDAI Token fetched : ${mDAI.address}\n`)

    //Fetch the deployed exchange  
    const exchange = await ethers.getContractAt('Exchange','0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9')
    console.log(`Exchange fetched : ${exchange.address}\n`)

    //Give tokens to account1
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    //user1 transfer 10,000 mETH
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    console.log(`Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

    //Set up users
    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    //Distribute tokens
    //User1 Approves token
    transaction = await Dapp.connect(user1).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user1.address}`)

    //Deposit tokens to exchange
    transaction = await exchange.connect(user1).depositToken(Dapp.address, amount)
    await transaction.wait()
    console.log(`Deposit ${amount} Ether from ${user1.address}\n`)

    //User2 Approves token
    transaction = await mETH.connect(user2).approve(exchange.address, amount)
    await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user2.address}`)

    //Deposit tokens to exchange
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount)
    await transaction.wait()
    console.log(`Deposit ${amount} tokens from ${user2.address}\n`)

    /// Send a cancelled order
    //user1 makes order
    let orderId
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), Dapp.address, tokens(5))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    //user1 cancel orders
    transaction = await exchange.connect(user1).cancelOrder(1)
    result = await transaction.wait()
    console.log(`Cancelled order from ${user1.address}\n`)

    //Wait 1 second
    await wait(1)

    /// Send filling orders
    //user1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), Dapp.address, tokens(10))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    //user2 fills order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    //Wait 1 second
    await wait(1)

    //user1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), Dapp.address, tokens(15))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    //user2 fills another order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    //Wait 1 second
    await wait(1)

    //user1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), Dapp.address, tokens(20))
    result = await transaction.wait()
    console.log(`Made order from ${user1.address}`)

    //user2 fills another order
    orderId = result.events[0].args.id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order from ${user1.address}\n`)

    //Wait 1 second
    await wait(1)

    /// Seed Open Orders
    //User1 makes 10 orders
    for ( let i=1; i<=10; i++){
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10*i), Dapp.address, tokens(10))
        result = await transaction.wait()

        console.log(`Made order from ${user1.address}`)

        //Wait 1 second
        await wait(1)
    }

    //User2 makes 10 orders
    for ( let i=1; i<=10; i++){
        transaction = await exchange.connect(user2).makeOrder(Dapp.address, tokens(10), mETH.address, tokens(10*i))
        result = await transaction.wait()

        console.log(`Made order from ${user2.address}`)

        //Wait 1 second
        await wait(1)
    }

}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});