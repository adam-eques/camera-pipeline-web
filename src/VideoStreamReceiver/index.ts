import { Peer, WsMsg, WSType } from "@/types";

class VideoStreamReceiver {
  socket: WebSocket;
  peer: Peer

  constructor(socket: WebSocket, peer: Peer, onTrack: Function) {
    this.socket = socket
    this.peer = peer

    socket.onopen = () => {
      console.log("socket connected")
      socket.send("client")
    }

    socket.onclose = ((evt: CloseEvent) => {
      console.log("socket was disconnected")
    })

    socket.onmessage = async (evt: MessageEvent<any>) => {
      let received: WsMsg = JSON.parse(evt.data)
      console.log("socket meesage received", received)
      switch (received.WSType) {
        case WSType.SDP:
          let answer = received.Answer
          const currentPeerConnection = this.peer.peerConnection
          currentPeerConnection?.setRemoteDescription(
            new RTCSessionDescription({
              sdp: answer,
              type: 'answer',
            })
          ).then(() => {
            const iceQueue = this.peer.iceQueue
            const peerConnection = this.peer.peerConnection
            if (iceQueue && peerConnection) {
              while (iceQueue.length > 0) {
                const ice = iceQueue.pop()
                peerConnection.addIceCandidate(ice)
                  .then(() => {
                    console.log("ice candidate added", ice)
                  })
                  .catch((reason: any) => {
                    console.error("ice candidate adding failed", ice, reason)
                  })
              }
            }
          })
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
      if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
        peerConnection.restartIce()
      }
    }
    
    peerConnection.ontrack = onTrack(this.peer)
  }

  // make offer and send it to signaling server
  makeOffer(audio: boolean, video: boolean){
    let currentPeerConnection = this.peer.peerConnection
    currentPeerConnection?.createOffer({
      offerToReceiveAudio: audio,
      offerToReceiveVideo: video
    }).then((sdp: RTCSessionDescriptionInit) => {
      currentPeerConnection?.setLocalDescription(sdp)
      this.peer.peerConnection.onicecandidate = (evt: RTCPeerConnectionIceEvent) => {
        console.log("my candidate:", evt.candidate?.toJSON())
        if (evt.candidate) {
          this.sendWSMsg({
            WSType: WSType.ICE,
            ICE: evt.candidate.toJSON()
          })
        }
      }
      console.log("SDP generated", sdp)
      this.sendWSMsg({
        WSType: WSType.SDP,
        SDP: sdp.sdp
      })
      console.log("SDP sent via signaling server")
    }).catch((reason: any) => {
      console.error("createOffer failed", reason)
    })
  }

  sendWSMsg(data: WsMsg) {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.log("websocket connection is not yet opened")
    }
  }
}


export default VideoStreamReceiver
