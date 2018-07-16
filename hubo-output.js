
module.exports = function(RED) {
  function HuboOutputNode(config) {
    RED.nodes.createNode(this, config)

    const node = this
    const hubo = RED.nodes.getNode(config.hubo)
    const channel = parseInt(config.channel)
    if(!hubo) return

    node.status({fill:'red', shape:'dot', text:'OFF'})
    node.on('input', function(msg) {
      const state = msg.payload
      hubo.setOutput(channel, state)
      if(state) node.status({fill:'green', shape:'dot', text:'ON'})
      else node.status({fill:'red', shape:'dot', text:'OFF'})
    })
  }

  RED.nodes.registerType('hubo-output', HuboOutputNode);
}
