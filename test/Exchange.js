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
        token1 = await Token.deploy('Dapp', 'DAPP', 1000000) 
        token2 = await Token.deploy('Mock Dai', 'mDAI', 1000000) 

        //Fetch the Accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

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
                await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
            })

        })
    })

    describe('Order actions', async() => {
        let transaction, result
        let amount = tokens(1)

        beforeEach(async()=>{

            //Approve user1 to token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()

            //Connect user1 wallet to exchange and deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()

            //Give token to user2
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(2))
            result = await transaction.wait()

            // Approve user 2 to token
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
            result = await transaction.wait()

            //Connect user2 wallet to exchange and deposit token
            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            result = await transaction.wait()

            //Make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
            result = await transaction.wait()
        })
        
        describe('Cancelling orders',async()=>{

            describe('Success', async ()=> {

                beforeEach( async ()=>{
                    
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    result = await transaction.wait()
                })

                it('Updates canceled orders',async()=>{
                    expect (await exchange.orderCancelled(1)).to.equal(true)
                })

                it('Emits a cancel event', async ()=>{
                    //Check that order has been emitted
                    const eventLog = result.events[0] 
                    expect (eventLog.event).to.equal('Cancel')
        
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

            describe('Failure', async()=>{

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

                it('Rejects invalid order ids',async()=>{
                    const invalidOrderId = 99999
                    await expect (exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.reverted

                })
                
                it('Rejects unauthorized cancellations',async()=>{
                    //Use user2 to cancel order and fail
                    await expect (exchange.connect(user2).cancelOrder(1)).to.be.reverted

                })


            })
        })

        describe('Filling orders',async()=>{

            describe('Success', async()=>{

                beforeEach( async ()=>{
                    //user2 fills order
                    transaction = await exchange.connect(user2).fillOrder(1)
                    result = await transaction.wait()
                })
    
                it('Executes the trade and charge fees', async()=>{
                    //Token Give
                    expect (await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
                    expect (await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                    expect (await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
    
                    //Token Get
                    expect (await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                    expect (await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                    expect (await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
                })
    
    
                it('Updates filled orders', async ()=>{
                    //Check that order has been emitted
                    expect(await exchange.orderFilled(1)).to.equal(true)
                })
    
                it('Emits a Trade event', async ()=>{
                    //Check that order has been emitted
                    const eventLog = result.events[0] 
                    expect (eventLog.event).to.equal('Trade')
        
                    //Check if the arguments are correct
                    const args = eventLog.args
                    expect (args.id).to.equal(1)
                    expect (args.user).to.equal(user2.address)
                    expect (args.tokenGet).to.equal(token2.address)
                    expect (args.tokenGive).to.equal(token1.address)
                    expect (args.amountGet).to.equal(tokens(1))
                    expect (args.amountGive).to.equal(tokens(1))
                    expect (args.creator).to.equal(user1.address)
                    expect (args.timestamp).to.at.least(1)
                })
            })

            describe('Failure', ()=>{

                it('Rejects invalid order ids', async()=>{
                    const invalidOrderId = 99999
                    await expect (exchange.connect(user2).fillOrder(invalidOrderId)).to.be.reverted

                })

                it('Rejects already filled orders', async()=>{
                    transaction = await exchange.connect(user2).fillOrder(1)
                    await transaction.wait()

                    await expect (exchange.connect(user2).fillOrder(1)).to.be.reverted
                })

                it('Rejects cancelled orders', async()=>{
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    await transaction.wait()

                    await expect (exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
            })
        })
    })
})

