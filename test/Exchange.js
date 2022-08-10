const { ethers } = require('hardhat')
const { expect } = require('chai')

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', ()=>{
    let deployer, feeAccount, exchange

    const feePercent = 10

    beforeEach( async ()=>{
        //Fetch contract from Factory
        const Exchange = await ethers.getContractFactory('Exchange')  
        const Token = await ethers.getContractFactory('Token') 

        //Deploy contract to the Blockchain
        token1 = await Token.deploy('My Token', 'DAPP', 1000000) 
        token2 = await Token.deploy('Mock Dai', 'mDAI', 1000000) 

        //Fetch the Accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]

        //Fund user so he can perform transactions
        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()
        
        //Deploy contract to the Blockchain
        exchange = await Exchange.deploy(feeAccount.address, feePercent) 

    })
        
    describe('Deployment', ()=>{
        
        //Tests go inside here...
        it('Tracks the fee account', async ()=>{
            //Read info from the deployed instance and check that value is correct
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('Tracks the fee percent', async ()=>{
            //Read Token info from the deployed instance and check that name is correct
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })


    describe('Depositing Tokens',()=>{
        let transaction, result
        let amount = tokens(10)

        describe('Success',()=>{

            beforeEach( async ()=>{

                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
    
                //Connect user wallet to exchange and deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
            
            })

            it('Tracks the token deposit', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })

            it('Emits a deposit event', async ()=>{
                //Check that deposit has been emitted
                const eventLog = result.events[1] //2 Events are emitted
                expect (eventLog.event).to.equal('Deposit')
    
                //Check if the arguments are correct
                const args = eventLog.args
                expect (args.token).to.equal(token1.address)
                expect (args.user).to.equal(user1.address)
                expect (args.amount).to.equal(amount)
                expect (args.balance).to.equal(amount)

            })

        })

        describe('Failure', ()=>{
            it('Fails when no tokens are approved',async()=> {
            await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            
            })
        })
    })

    describe('Withdrawing Tokens',()=>{
        let transaction, result
        let amount = tokens(10)

        describe('Success',()=> {

            beforeEach( async ()=>{

                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
    
                //Connect user wallet to exchange and deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                //Now withdraw token
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()
                

            })

            it('Withdraws token funds', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })

            it('Emits a withdraw event', async ()=>{
                //Check that withdraw has been emitted
                const eventLog = result.events[1] //2 Events are emitted
                expect (eventLog.event).to.equal('Withdraw')
    
                //Check if the arguments are correct
                const args = eventLog.args
                expect (args.token).to.equal(token1.address)
                expect (args.user).to.equal(user1.address)
                expect (args.amount).to.equal(amount)
                expect (args.balance).to.equal(0)
            })
        })

        describe('Failure',()=> {

            it('Fails for insuff balance', async()=>{
            //Attempt to withdraw without depositing
            await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            })
        })
    })

    describe('Checking balances',()=>{
        let transaction, result
        let amount = tokens(1)

        beforeEach( async ()=>{

            //Approve token for user1
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()

            //Connect user wallet to exchange and deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        
        })

        it('returns user balanace', async()=>{
            expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(amount) 
        })
    })

    describe('Making orders', async ()=>{
        let transaction, result
        let amount = tokens(1)
        

        describe('Success', async ()=> {

            beforeEach( async ()=>{
                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
    
                //Connect user wallet to exchange and deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()

                //Make order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await transaction.wait()
            })

            it('Tracks the newly created order', async()=>{
                expect(await exchange.orderCount()).to.equal(1) 
            })

            it('Emits an order event', async ()=>{
                //Check that order has been emitted
                const eventLog = result.events[0] 
                expect (eventLog.event).to.equal('Order')
    
                //Check if the arguments are correct
                const args = eventLog.args
                expect (args.id).to.equal(1)
                expect (args.user).to.equal(user1.address)
                expect (args.tokenGet).to.equal(token2.address)
                expect (args.tokenGive).to.equal(token1.address)
                expect (args.amountGet).to.equal(tokens(1))
                expect (args.amountGive).to.equal(tokens(1))
                expect (args.timestamp).to.at.least(1)
            })
        })

        describe('Failure',async ()=> {
            it('Rejects orders with no balance',async()=>{
                await expect(exchange.connect(user1).makeOrder((token2.address, tokens(1), token1.address, tokens(1)))).to.be.reverted
            })

        })
    })

    
})

