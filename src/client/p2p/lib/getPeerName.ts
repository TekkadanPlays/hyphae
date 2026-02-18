import { funAnimalName } from 'fun-animal-names'

export const getPeerName = (peerId: string) => {
  return funAnimalName(peerId)
}

export const getDisplayUsername = (
  peerId: string,
  peerList: Array<{ peerId?: string; userId?: string; customUsername?: string }>,
  selfUserId?: string,
  selfCustomUsername?: string,
) => {
  if (selfUserId && peerId === selfUserId) {
    return selfCustomUsername || getPeerName(peerId)
  }

  const peer = peerList.find(p => p.userId === peerId)
  if (peer?.customUsername) return peer.customUsername

  return getPeerName(peerId)
}
