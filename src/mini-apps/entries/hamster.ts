import { defineMiniApp } from '../helpers.js'

export const hamsterMiniApp = defineMiniApp<'hamster'>({
  name: 'hamster',
  callback({ logger, userBot }) {
    userBot.sendMessage('me', { message: 'Holla from hamster' })
    logger.success('Message was succesfully sent to telegram me')
  },
})
