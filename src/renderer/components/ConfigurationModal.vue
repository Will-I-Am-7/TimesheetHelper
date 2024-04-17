<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { computed, ref } from 'vue';
import { UserConfigModel } from '../../models/userConfigModel'
import { required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'
import OverlayPanel from 'primevue/overlaypanel';
import Image from 'primevue/image';
import { useToast } from 'primevue/usetoast';
import BlockUI from 'primevue/blockui';
import RadioButton from 'primevue/radiobutton';
import Divider from 'primevue/divider';
import { useConfigurationStore } from '../stores/configurationStore';

const { getConfiguration, updateConfiguration } = useConfigurationStore();

const toast = useToast();

defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['close', 'configuration-update-success'])

const overlayPanel = ref()

const loading = ref<boolean>(false)

const originalTargetProcessAccessToken = ref('')

const originalTimeTrackerAccessToken = ref('')

const helpType = ref<string>('')

const configurationForm = ref<UserConfigModel>({
  accessToken: '',
  userId: '',
  apiBaseUrl: '',
  timeTracker: '',
  name: '',
  surname: '',
  theme: '',
  timeTrackerApiToken: '',
  clockifyUserId: '',
  clockifyWorkspaceId: ''
})

const formRules = computed(() => {
  return {
    accessToken: { required },
    userId: { required },
    apiBaseUrl: { required }
  }
})

const v$ = useVuelidate(formRules, configurationForm)

const isFormValid = () => {
  v$.value.$validate()

  if (v$.value.$error) {
    return false
  }

  return true
}

const submitForm = async () => {
  if (!isFormValid()) {
    return
  }

  // TODO: Error handle this
  loading.value = true
  await window.fileSystemAPI.setUserConfig({
    ...configurationForm.value
  })
  loading.value = false

  updateConfiguration({...configurationForm.value})

  emit('configuration-update-success')
}

const onDialogShow = () => {
  const configuration = getConfiguration()
  configurationForm.value = {
    ...configuration,
    theme: configuration.theme && configuration.theme.trim().length > 0 ? configuration.theme : 'lara-dark-blue'
  }
  originalTargetProcessAccessToken.value = configuration.accessToken ?? ''
  originalTimeTrackerAccessToken.value = configuration.timeTrackerApiToken ?? ''
}

const toggleOverlay = (event: any, help: string) => {
  helpType.value = help
  overlayPanel.value.toggle(event);
}

const testConnection = async () => {
  loading.value = true
  const result = await window.httpApi.getTpLoggedUser({
    ...configurationForm.value
  }, 'v1/Users/loggeduser')
  loading.value = false
  if (result.success) {
    originalTargetProcessAccessToken.value = configurationForm.value.accessToken
    configurationForm.value.userId = result.data?.Id + ''
    configurationForm.value.name = result.data?.FirstName ?? 'John'
    configurationForm.value.surname = result.data?.LastName ?? 'Doe'
    toast.add({ severity: 'success', summary: `Hi ${result.data?.FirstName} ${result.data?.LastName}`, detail: 'Connection to target process established', life: 5000 });
  } else {
    originalTargetProcessAccessToken.value = ''
    toast.add({ severity: 'error', summary: 'Oops!', detail: 'Something is not right. Please validate configuration', life: 5000 });
  }
}

const timeTrackerTokenEntered = () => {
  return configurationForm.value.timeTrackerApiToken && configurationForm.value.timeTrackerApiToken.trim().length > 0
}

const getClockifyDetails = async () => {
  const clockifyDetailsResult = await window.httpApi.getClockifyUserDetails({...configurationForm.value}, 'v1/user')
  if (clockifyDetailsResult.success) {
    configurationForm.value.clockifyUserId = clockifyDetailsResult.data?.id
    configurationForm.value.clockifyWorkspaceId = clockifyDetailsResult.data?.activeWorkspace
  }

  return clockifyDetailsResult.success
}

const testTimeTrackerConnection = async () => {
  loading.value = true
  let success = await window.httpApi.testTimeTrackApiConnection({
    ...configurationForm.value
  })
  if (success && configurationForm.value.timeTracker === 'clockify') {
    success = await getClockifyDetails()
  }
  loading.value = false

  if (success) {
    originalTimeTrackerAccessToken.value = configurationForm.value.timeTrackerApiToken ?? ''
    toast.add({ severity: 'success', summary: 'Yay!', detail: 'Connection succeeded!', life: 5000 });
  } else {
    originalTimeTrackerAccessToken.value = ''
    toast.add({ severity: 'error', summary: 'Oops!', detail: 'Connection failed. Please validate configuration', life: 5000 });
  }
}

const shouldVerifyTimeTrackerConnection = computed(() => {
  if (!configurationForm.value.timeTrackerApiToken || configurationForm.value.timeTrackerApiToken.trim().length === 0) {
    return false
  }
  return originalTimeTrackerAccessToken.value !== configurationForm.value.timeTrackerApiToken
})

const shouldVerifyTargetProcessConnection = computed(() => {
  return originalTargetProcessAccessToken.value !== configurationForm.value.accessToken
})

const saveButtonTooltip = () => {
  if (shouldVerifyTimeTrackerConnection.value) {
    return 'Verify your time tracker connection first'
  }
  if (shouldVerifyTargetProcessConnection.value) {
    return 'Verify your target process connection first'
  }
  if (!isFormValid()) {
    return 'Incomplete values'
  }
  return ''
}

const onTimetrackerChange = () => {
  originalTimeTrackerAccessToken.value = ''
}
</script>

<template>
  <div>
      <Dialog @show="onDialogShow()" :closable="false" :visible="visible" position="top" class="w-6" modal header="Configuration">
        <BlockUI :blocked="loading">
          <span class="p-text-secondary block mb-5">Update your target process configuration.</span>
          <div class="flex align-items-center gap-3 mb-3">
              <label for="email" class="font-semibold w-8rem">Time tracker</label>
              <div class="flex align-items-center">
                <RadioButton @change="onTimetrackerChange()" v-model="configurationForm.timeTracker" inputId="toggl" name="toggl" value="toggl" />
                <label for="ingredient1" class="ml-2">Toggl Track :(</label>
              </div>
              <div class="flex align-items-center">
                  <RadioButton v-model="configurationForm.timeTracker" inputId="clockify" name="clockify" value="clockify" />
                  <label for="ingredient2" class="ml-2">Clockify :)</label>
              </div>
          </div>
          <Divider />
          <div class="flex align-items-center gap-3 mb-3 mt-5">
              <label for="email" class="font-semibold w-8rem">TP Access Token</label>
              <Button @click="toggleOverlay($event, 'accessToken')" icon="pi pi-question-circle" severity="help" text rounded aria-label="Cancel" />
              <InputText :class="{ 'p-invalid': v$.accessToken.$error }" v-model="configurationForm.accessToken" class="flex-auto" autocomplete="off" />
          </div>
          <div class="flex align-items-center gap-3 mb-5">
              <label for="username" class="font-semibold w-8rem">TP User Id</label>
              <Button @click="toggleOverlay($event, 'userId')" icon="pi pi-question-circle" severity="help" text rounded aria-label="Cancel" />
              <InputText disabled :class="{ 'p-invalid': v$.userId.$error }" v-model="configurationForm.userId" class="flex-auto" autocomplete="off" />
          </div>
          <Divider />
          <div class="flex align-items-center gap-3 mb-5">
              <label for="email" class="font-semibold w-15rem">Time Tracker Access Token</label>
              <Button @click="toggleOverlay($event, 'timeTrackerAccessToken')" icon="pi pi-question-circle" severity="help" text rounded aria-label="Cancel" />
              <InputText placeholder="Optional" v-model="configurationForm.timeTrackerApiToken" class="flex-auto" autocomplete="off" />
          </div>
          <div class="flex justify-content-start gap-2">
              <Button :loading="loading" @click="testConnection()" v-if="configurationForm.accessToken && configurationForm.accessToken.trim().length > 0" label="Verify TP connection" severity="help" />
              <Button :loading="loading" @click="testTimeTrackerConnection()" v-if="timeTrackerTokenEntered()" label="Verify Time Tracker connection" severity="help" />
          </div>
          <div class="flex justify-content-end gap-2">
              <Button type="button" label="Cancel" severity="secondary" @click="$emit('close')"></Button>
              <div v-tooltip.bottom="{value: saveButtonTooltip()}">
                <Button :loading="loading" type="button" label="Save" :disabled="!isFormValid() || shouldVerifyTargetProcessConnection || shouldVerifyTimeTrackerConnection" @click="submitForm()"></Button>
              </div>
          </div>
        </BlockUI>
      </Dialog>
    <OverlayPanel ref="overlayPanel">
      <div v-if="helpType === 'userId'">
        <div class="flex flex-column gap-2 w-30rem">
          <div class="mb-2">
            Click on the 'Verify TP connection' button below
          </div>
        </div>
      </div>
      <div v-if="helpType === 'accessToken'">
        <div class="flex flex-column gap-3 w-30rem">
          <div>
            1.) Go to your profile in target process:
          </div>
          <Image src="AccessToken1.PNG" preview alt="Image" width="300" />
          <div>
            2.) Go the the 'Access Tokens' tab:
          </div>
          <Image src="AccessToken2.PNG" preview alt="Image" width="300" />
          <div>
            3.) Click on '+ Add Token':
          </div>
          <Image src="AccessToken3.PNG" preview alt="Image" width="300" />
          <div>
            4.) Create token and copy the long value
          </div>
          <Image src="AccessToken4.PNG" preview alt="Image" width="300" />
        </div>
      </div>
      <div v-if="helpType === 'timeTrackerAccessToken'">
        <div class="flex flex-column gap-1 w-20rem">
          TODO!
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>