
module.exports = function(RED) {
  function HuboInputNode(config) {
    RED.nodes.createNode(this, config)

    const node = this
    const hubo = RED.nodes.getNode(config.hubo)
    const channel = config.channel.toString()
    if(!hubo) return

    const listener = function(state){
      if(state) node.status({fill:'green', shape:'dot', text:'ON'})
      else node.status({fill:'red', shape:'dot', text:'OFF'})

      node.send({
        payload: state,
        input: parseInt(channel)
      })
    }

    node.status({fill:'red', shape:'dot', text:'OFF'})
    hubo.on(channel, listener)

    node.close = function(){
      hubo.removeListener(channel, listener)
    }
  }

  RED.nodes.registerType('hubo-input', HuboInputNode);
}
