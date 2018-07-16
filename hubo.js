const i2c = require('i2c-bus')


const CMD_OUPUT = 0x12 // hubo output i2c address
const CMD_INPUT = 0x13 // hubo input i2c address

module.exports = function(RED) {
  function HuboNode(config) {
    RED.nodes.createNode(this, config)

    const node = this
    const address = parseInt(config.address) // the hubo i2c address
    const device = parseInt(config.device) // the hubo device id
    const DIGITAL_INPUTS = parseInt(config.inputs) // number of digial inputs
    const DIGITAL_OUTPUTS = parseInt(config.outputs) // number of digital outputs
    const READ_INTERVAL = parseInt(config.interval) // read interval in ms
    var INPUT_STATE = 0x00 // input state of the i2c bus
    var OUTPUT_STATE = 0x00 // output state of the i2c bus

    const bus = i2c.openSync(device)

    this.close = function(){
      bus.closeSync()
    }

    // initialize
    bus.writeByteSync(address, 0x00, 0x00)

    // get current output state
    OUTPUT_STATE = bus.readByteSync(address, CMD_OUPUT)


    this.setOutput = function(channel, state){
      // check if channel is a valid number
      if(typeof channel !== 'number' || isNaN(channel)) return
      if(channel < 0 || channel >= DIGITAL_OUTPUTS) return
      // check if we have a change in state
      if(((OUTPUT_STATE & (1 << channel)) !== 0) === state) return

      var newState = 0x00

      // add given channel to bitmask
      if(state) newState += (1 << channel)

      for (var index = 0; index < DIGITAL_INPUTS; index++) {
        if(index === channel) continue
        var currentState = (OUTPUT_STATE & (1 << index)) !== 0
        // add current channel to bitmask
        if(currentState) newState += (1 << index)
      }

      OUTPUT_STATE = newState
      // write to bus
      bus.writeByteSync(address, CMD_OUPUT, newState)
    }


    function readInputState(){
      bus.readByte(address, CMD_INPUT, (error, data) => {
        if(error) throw error

        // 0xFF = all digital inputs are off
        // convert to 0x00 = all digial inputs off
        data = 0xFF - data

        // if state has changed
        if(data !== INPUT_STATE){
          // check all digital inputs
          for (var index = 0; index < DIGITAL_INPUTS; index++) {
            // convert bitmask to boolean value
            var currentState = (INPUT_STATE & (1 << index)) !== 0
            var newState = (data & (1 << index)) !== 0

            // emit new event if state if current digital input has changed
            if(currentState !== newState){
              node.emit(index.toString(), newState)
            }
          }

          // set new input state
          INPUT_STATE = data
        }

        // schedule next read!
        setTimeout(readInputState, READ_INTERVAL)
      })
    }

    // start input read
    readInputState()
  }

  RED.nodes.registerType('hubo', HuboNode)
}
