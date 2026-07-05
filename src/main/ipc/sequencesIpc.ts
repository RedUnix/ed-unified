import { ipcMain, shell } from 'electron'
import { IpcChannels } from '@shared/ipcChannels'
import type { LaunchSequenceRecord, NewLaunchSequenceInput } from '@shared/types'
import * as repo from '../data/libraryRepository'
import { writeBatFile, deleteBatFile } from '../platform/windowsBatBuilder'
import { launchPath } from '../platform'

export function registerSequencesIpc(): void {
  ipcMain.handle(IpcChannels.sequencesList, () => repo.listLaunchSequences())
  ipcMain.handle(IpcChannels.sequencesCreate, (_e, input: NewLaunchSequenceInput) =>
    repo.createLaunchSequence(input)
  )
  ipcMain.handle(
    IpcChannels.sequencesUpdate,
    (_e, id: string, patch: Partial<LaunchSequenceRecord>) => repo.updateLaunchSequence(id, patch)
  )
  ipcMain.handle(IpcChannels.sequencesDelete, async (_e, id: string) => {
    const sequences = await repo.listLaunchSequences()
    const sequence = sequences.find((s) => s.id === id)
    deleteBatFile(sequence?.batFilePath)
    await repo.deleteLaunchSequence(id)
  })

  ipcMain.handle(IpcChannels.sequencesGenerateBat, async (_e, id: string) => {
    const [sequences, tools] = await Promise.all([repo.listLaunchSequences(), repo.listTools()])
    const sequence = sequences.find((s) => s.id === id)
    if (!sequence) throw new Error(`Launch sequence not found: ${id}`)
    const batFilePath = writeBatFile(sequence, tools)
    return repo.updateLaunchSequence(id, { batFilePath })
  })

  ipcMain.handle(IpcChannels.sequencesRunNow, async (_e, id: string) => {
    const [sequences, tools] = await Promise.all([repo.listLaunchSequences(), repo.listTools()])
    let sequence = sequences.find((s) => s.id === id)
    if (!sequence) throw new Error(`Launch sequence not found: ${id}`)
    if (!sequence.batFilePath) {
      const batFilePath = writeBatFile(sequence, tools)
      sequence = await repo.updateLaunchSequence(id, { batFilePath })
    }
    launchPath(sequence.batFilePath as string)
  })

  ipcMain.handle(IpcChannels.sequencesRevealBat, async (_e, id: string) => {
    const sequences = await repo.listLaunchSequences()
    const sequence = sequences.find((s) => s.id === id)
    if (!sequence?.batFilePath) throw new Error('No .bat file has been generated for this sequence yet.')
    shell.showItemInFolder(sequence.batFilePath)
  })
}
