import { useEffect, useState } from "react";
import { debug, DebugType } from '../utils/logs'

export default function useSocketConnetion(isStarted: boolean) {
  const [state, setState] = useState<{ socket: undefined | WebSocket }>({ socket: undefined });
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '')
    socket.onopen = () => {
      debug(DebugType.INFO, "socket connected")
      // socket.send("client")
    };
    socket.onmessage = (e: MessageEvent<any>) => {
      debug(DebugType.LOG, "socket message received", e.data)
    };
    socket.onclose = () => {
      debug(DebugType.INFO, "socket disconnected")
    }
    socket.onerror = (e: Event) => {
      debug(DebugType.ERROR, "socket error", e)
    }
    setState({
      socket: socket,
    });

    console.log(state)

    return function cleanup() {
      if (socket) {
        socket.close()
      }
    };
  }, [isStarted]);
  return state;
}
