export enum DebugType {
  LOG,
  ERROR,
  WARN,
  INFO,
  ASSERT
}

const mode = "DEV"

export const debug = (type: DebugType = DebugType.LOG, info: string, data?: any) => {
  if (mode === "DEV") {
    switch (type) {
      case DebugType.LOG:
        console.log(info)
        console.log(data)
        break
      case DebugType.ERROR:
        console.error(info)
        console.error(data)
        break
      case DebugType.WARN:
        console.warn(info)
        console.warn(data)
        break
      case DebugType.INFO:
        console.info(info)
        break
      case DebugType.ASSERT:
        console.assert(info)
        console.assert(data)
        break
      default:
        console.error(`Unknown DebugType: ${type}`)
    }
  }
}