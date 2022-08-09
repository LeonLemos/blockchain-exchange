const { ethers } = require('hardhat')
const { expect } = require('chai')

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange',()=>{
    let deployer, feeAccount, exchange

    const feePercent = 10

    beforeEach( async ()=>{
        //Fetch contract from Factory
        const Exchange = await ethers.getContractFactory('Exchange')  

        //Fetch the Accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]

        //Deploy contract to the Blockchain
        exchange = await Exchange.deploy(feeAccount.address, feePercent) 

    })
        
    describe('Deployment', ()=>{
        
        //Tests go inside here...
        it('Tracks the fee account', async ()=>{
            //Read Token info(name) from the deployed instance and check that name is correct
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('Tracks the fee percent', async ()=>{
            //Read Token info(name) from the deployed instance and check that name is correct
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })
})
