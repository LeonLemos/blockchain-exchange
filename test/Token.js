const { ethers } = require('hardhat')
const { expect } = require('Chai')

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token',()=>{
    let token
    //Tests go inside here...

    beforeEach( async ()=>{
        //Fetch Token contract from Factory
        const Token = await ethers.getContractFactory('Token')  
        //Deploy contract to the Blockchain
        token = await Token.deploy('My Token','DAPP', 1000000) 
    })

    describe('Deployment', ()=>{
        const name = 'My Token'
        const symbol = 'DAPP'
        const decimals = 18
        const totalSupply = 1000000

        it('has correct name', async ()=>{
            //Read Token info(name) from the deployed instance and check that name is correct
            expect(await token.name()).to.equal(name)
        })
    
        it('has correct symbol', async ()=>{
            //Read Token info(symbol) from the deployed instance and check that symbol is correct
            expect(await token.symbol()).to.equal(symbol)
        })
    
        it('has correct decimals', async ()=>{
            //Read Token info(decimals) from the deployed instance and check that symbol is correct
            expect (await token.decimals()).to.equal(decimals)
        })
    
        it('has correct totalSupply', async ()=>{
            //Read Token info(supply) from the deployed instance and check that symbol is correct
            expect(tokens(await token.totalSupply()).toString()).to.equal(tokens(totalSupply).toString()) 
        })

    })

})