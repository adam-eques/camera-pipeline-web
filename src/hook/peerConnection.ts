import { useEffect, useState } from "react";
import { Peer } from "../types";
import { iceConfig } from "../utils/constants";
import { debug, DebugType } from '../utils/logs'

export default function usePeerConnection(isStarted: boolean) {
  const [state, setState] = useState<Peer | undefined>(undefined);
  useEffect(() => {
    const newPeerConnection = new RTCPeerConnection(iceConfig)
    // const sendChannel = newPeerConnection.createDataChannel("sendChannel")
    setState({
      peerConnection: newPeerConnection,
      // sendChannel: sendChannel,
      iceQueue: []
    })

    newPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
      console.log(ev)
    }

    console.log(state)

    return function cleanup() {
      if (newPeerConnection) {
        newPeerConnection.close()
      }
    };
  }, [isStarted]);
  return state;
}
