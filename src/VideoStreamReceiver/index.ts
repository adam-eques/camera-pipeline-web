import { Peer, WsMsg, WSType } from "@/types";

class VideoStreamReceiver {
  socket: WebSocket;
  peer: Peer

  constructor(socket: WebSocket, peer: Peer, onTrack: Function, onNotReady: Function, onDisconnected: Function) {
    this.socket = socket
    this.peer = peer

    socket.onopen = () => {
      console.log("socket connected")
    }

    socket.onclose = ((evt: CloseEvent) => {
      console.log("socket was disconnected")
    })

    socket.onmessage = async (evt: MessageEvent<string>) => {
      console.log(evt.data)
      let received: WsMsg = JSON.parse(evt.data)
      console.log("socket meesage received", received)
      switch (received.WSType) {
        case WSType.CONNECTED:
          if (received.Data === "available") {
            this.makeOffer()
          } else {
            onNotReady()
          }
          break
        case WSType.SDP:
          let answer = received.SDP || ""
          const currentPeerConnection = this.peer.peerConnection
          currentPeerConnection?.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(atob(answer)))
          )
          //   .then(() => {
          //   const iceQueue = this.peer.iceQueue
          //   if (iceQueue) {
          //     while (iceQueue.length > 0) {
          //       const ice = iceQueue.pop()
          //       currentPeerConnection.addIceCandidate(ice)
          //         .then(() => {
          //           console.log("ice candidate added", ice)
          //         })
          //         .catch((reason: any) => {
          //           console.error("ice candidate adding failed", ice, reason)
          //         })
          //     }
          //   }
          // })
          break
        case WSType.ICE:
          let ice = received.ICE || {}
          console.log("ICE received", ice)
          if (this.peer.peerConnection) {
            if (this.peer.peerConnection.remoteDescription) {
              const currentPeerConnection = peer?.peerConnection
              ice && currentPeerConnection?.addIceCandidate(new RTCIceCandidate(ice))
                .then(() => {
                  console.log("addIceCandidate success: ", ice)
                }, (reason: any) => {
                  console.error("addIceCandidate failed", ice, reason)
                }).catch((reason: any) => {
                  console.error(reason)
                })
            } else {
              this.peer.iceQueue?.push(ice)
            }
          }
          break
        case WSType.ERROR:
          alert(received.Data)
          break
        default:
          console.log('unknown WSType', received.WSType)
      }
    }

    const peerConnection = this.peer.peerConnection
    peerConnection.oniceconnectionstatechange = (ev: Event) => {
      console.log("local description: ", peerConnection.localDescription?.type)
      console.log("local description: ", peerConnection.localDescription?.sdp)
      console.log("remote description: ", peerConnection.remoteDescription?.type)
      console.log("remote description: ", peerConnection.remoteDescription?.sdp)
      console.log("IceCandidate State changed", peerConnection.iceConnectionState)
      if (peerConnection.iceConnectionState === 'disconnected') {
        onDisconnected()
      }
      // if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
      //   peerConnection.restartIce()
      // }
    }
    
    peerConnection.ontrack = onTrack(this.peer)
  }

  // make offer and send it to signaling server
  makeOffer() {
    let currentPeerConnection = this.peer.peerConnection
    currentPeerConnection.addTransceiver('video', { direction: 'recvonly' })
    currentPeerConnection?.createOffer().then((sdp: RTCSessionDescriptionInit) => {
      currentPeerConnection?.setLocalDescription(sdp)
      console.log("SDP generated", sdp)
      this.peer.peerConnection.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
        console.log("my candidate:", evt.candidate?.toJSON())
        if (evt.candidate === null) {
          this.sendWSMsg({
            WSType: WSType.SDP,
            SDP: btoa(JSON.stringify(currentPeerConnection.localDescription))
          })
          console.log("SDP sent via signaling server")
        }
      }
      
    }).catch((reason: any) => {
      console.error("createOffer failed", reason)
    })
  }

  start() {
    this.sendWSMsg({
      WSType: WSType.CONNECTED,
      Sender: false,
    })
  }

  sendWSMsg(data: WsMsg) {
    if (this.socket.readyState == WebSocket.OPEN) {
      data.Sender = false
      this.socket.send(JSON.stringify(data))
    } else {
      console.log("websocket connection is not yet opened")
    }
  }

}


export default VideoStreamReceiver
