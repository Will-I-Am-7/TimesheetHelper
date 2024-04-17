import { ref, Ref } from 'vue'
import { defineStore } from 'pinia'
import { UserConfigModel } from '../../models/userConfigModel'

export const useConfigurationStore = defineStore('configurationStore', () => {
  const configuration: Ref<UserConfigModel> = ref<UserConfigModel>({
    accessToken: '',
    apiBaseUrl: '',
    name: '',
    surname: '',
    theme: '',
    timeTracker: '',
    timeTrackerApiToken: '',
    userId: '',
    clockifyUserId: '',
    clockifyWorkspaceId: ''
  })

  const updateConfiguration = (updatedConfiguration: UserConfigModel) => {
    configuration.value = {
      ...updatedConfiguration
    }
  }

  const getConfiguration = () => {
    return {
      ...configuration.value
    }
  }

  return { updateConfiguration, getConfiguration }
})