const { ethers } = require('hardhat')
const { expect } = require('chai')

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token',()=>{
    let token, accounts, deployer, receiver

    beforeEach( async ()=>{
        //Fetch Token contract from Factory
        const Token = await ethers.getContractFactory('Token')  

        //Deploy contract to the Blockchain
        token = await Token.deploy('My Token','DAPP', 1000000) 

        //Fetch the Accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
    })

    describe('Deployment', ()=>{
        const name = 'My Token'
        const symbol = 'DAPP'
        const decimals = 18
        const totalSupply = tokens(1000000) //Use toString() to read BigNumbers

        
        //Tests go inside here...
        it('has correct name', async ()=>{
            //Read Token info(name) from the deployed instance and check that name is correct
            expect(await token.name()).to.equal(name)
        })
    
        it('has correct symbol', async ()=>{
            //Read Token info(symbol) from the deployed instance and check that symbol is correct
            expect(await token.symbol()).to.equal(symbol)
        })
    
        it('has correct decimals', async ()=>{
            //Read Token info(decimals) from the deployed instance and check that decimals are correct
            expect (await token.decimals()).to.equal(decimals)
        })
    
        it('has correct totalSupply', async ()=>{
            //Read Token info(supply) from the deployed instance and check that supply is correct
            expect (await token.totalSupply()).to.equal(totalSupply)
        })

        it('assigns total supply to deployer', async ()=>{
            //Read Token info(supply) from the deployed instance and check that symbol is correct
            expect (await token.balanceOf(deployer.address)).to.equal(totalSupply) 
        })

    })

    describe('Sending Token', ()=>{
        let amount, transaction, result

        describe('Success',()=>{

            beforeEach( async () => {
                // Log balance before transfer
                console.log('deployer balance before transfer', await token.balanceOf(deployer.address))
                console.log('receiver balance before transfer', await token.balanceOf(receiver.address))
    
                amount = tokens(100)
    
                //Connect deployer(as signer) to interact with the token contract and enable transfer
                transaction = await token.connect(deployer).transfer(receiver.address, amount) 
                result = await transaction.wait()
            })
    
            it('Transfers token balances', async ()=>{
                //Transfer Token
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
    
                //Log balance after transfer
                console.log('deployer balance after transfer', await token.balanceOf(deployer.address))
                console.log('receiver balance after transfer', await token.balanceOf(receiver.address))
    
                //Ensure that tokens were transfered ( balance changed )
            })
    
            it('Emits a transfer event', async ()=>{
                //Check that transfer has been emitted
                const eventLog = result.events[0]
                expect (eventLog.event).to.equal('Transfer')
    
                console.log(eventLog.args)
                //Check if the arguments are correct
                const args = eventLog.args
                expect (args.from).to.equal(deployer.address)
                expect (args.to).to.equal(receiver.address)
                expect (args.value).to.equal(amount)
            })
        })
        
        describe('Failure', ()=>{
            it('Rejects insufficient balances', async()=>{
                //Transfer more tokens than deployer has - 100M
                const invalidAmount = tokens(100000000) 
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })

            it('Rejects invalid recipient', async()=>{
                //Transfer more tokens than deployer has - 100M
                const mount = tokens(100000000) 
                await expect(token.connect(deployer).transfer('0x00', mount)).to.be.reverted 
        })
        })

    })

})