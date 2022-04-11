const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')

const Token = artifacts.require('ERC20Token.sol')

contract('ERC20Token', (accounts) => {
  let token = null
  const initialBalance = web3.utils.toBN(web3.utils.toWei('1'))

  before(async () => {
    token = await Token.new('My Block', 'BLK', 18, initialBalance)
  })

  it('Should return the total supply', async () => {
    const supply = await token.totalSupply()
    assert(supply.eq(initialBalance))
  })
  it('Should return the correct balance', async () => {
    const balance = await token.balanceOf(accounts[0])
    assert(balance.eq(initialBalance))
  })
  it('Should transfer token', async () => {
    const value = web3.utils.toBN(100)

    const receipt = await token.transfer(accounts[1], value)
    const balance1 = await token.balanceOf(accounts[0])
    const initialBalance = web3.utils.toBN(web3.utils.toWei('1'))

    assert(balance1.eq(initialBalance.sub(value))) //it should reduce the value of the sender
    expectEvent(receipt, 'Transfer', {
      from: accounts[0],
      to: accounts[1],
      tokens: value,
    })
    const balance2 = await token.balanceOf(accounts[1]) // it should increase the value of the receiver
    assert(balance2.eq(value))
  })
  it('Should not transfer it not sufficient balance', async () => {
    await expectRevert(
      token.transfer(accounts[1], web3.utils.toWei('10')),
      'not sufficient balance',
    )
  })
  it('Should increase the allowance', async () => {
    const value = web3.utils.toBN(1000)
    const receipt = await token.approve(accounts[1], value)

    const allowance = await token.allowance(accounts[0], accounts[1])

    assert(allowance.eq(value))
    expectEvent(receipt, 'Approval', {
      tokenOwner: accounts[0],
      spender: accounts[1],
      tokens: value,
    })
  })
  it('Should transfer NOT transfer it allowance is too low', async () => {
    const value = web3.utils.toBN(100000) // the allowance is very low when compared to the value
    await expectRevert(
      token.transferFrom(accounts[0], accounts[1], value),
      'allowance too low',
    )
  })
  it('Should NOT transfer if balance is too low', async () => {
    const value = web3.utils.toBN(100)
    await token.approve(accounts[3], value, { from: accounts[2] }) // balance of accounts[2] is 0 but we created an allowance of accounts[3] with it of 100 tokens, so the transfer should not take place as the balance of accounts[2] is not enough

    const allowance = await token.allowance(accounts[2], accounts[3])

    const balance = await token.balanceOf(accounts[2])
    console.log(allowance)
    console.log(balance)

    await expectRevert(
      token.transferFrom(accounts[2], accounts[3], value, {
        from: accounts[3],
      }),
      'token balance too low',
    )
  })
})
