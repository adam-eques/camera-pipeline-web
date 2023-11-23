export interface Peer {
  stream?: MediaStream,
  peerConnection: RTCPeerConnection,
  sendChannel?: RTCDataChannel,
  iceQueue? : RTCIceCandidateInit[]
}