<script setup lang="ts">
import Toast from 'primevue/toast';
import Menubar from 'primevue/menubar';
import { computed, onMounted, ref } from "vue";
import Message from 'primevue/message';
import ConfigurationModal from './components/ConfigurationModal.vue';
import MyProfileModal from './components/MyProfileModal.vue';
import { UserConfigModel } from '../models/userConfigModel';
import { useToast } from 'primevue/usetoast';
import TimesheetUploadComponent from './components/TimesheetUploadComponent.vue';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmPopup from 'primevue/confirmpopup';
import Avatar from 'primevue/avatar';
import { usePrimeVue } from 'primevue/config';
import { useConfigurationStore } from './stores/configurationStore';

const toast = useToast();
const primeVue = usePrimeVue();
const { getConfiguration, updateConfiguration } = useConfigurationStore();

const userConfig = ref<UserConfigModel | null>(null)
const configurationDialogVisible = ref(false)
const myProfileModalVisible = ref(false)
const timesheetUploadRef = ref<any>(null)

const menuItems = ref([
  {
    label: 'Configuration',
    icon: 'pi pi-cog',
    command: (event: any) => {
      configurationDialogVisible.value = true
    }
  }
]);

onMounted(() => {
  window.fileSystemAPI.retrieveUserConfig().then((config: UserConfigModel) => {
    // Set's the configuration globally in the store
    updateConfiguration({...config})
    userConfig.value = getConfiguration()
    primeVue.changeTheme('lara-dark-blue', userConfig.value.theme && userConfig.value.theme.trim().length > 0 ? userConfig.value.theme : 'lara-dark-blue', 'theme-link')

    if (configured.value) {
      menuItems.value.push({
        label: 'Import new timesheet',
        icon: 'pi pi-upload',
        command: (event: any) => {
          confirmReload(event.originalEvent)
        }
      })
    }
  })
})

const confirm = useConfirm();

const configured = computed(() =>
  userConfig.value?.accessToken && userConfig.value.accessToken.trim().length > 0)

const confirmReload = (event: any) => {
  confirm.require({
      target: event.currentTarget,
      message: 'Are you sure you want to proceed?',
      icon: 'pi pi-exclamation-triangle',
      rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
      acceptClass: 'p-button-sm',
      rejectLabel: 'Cancel',
      acceptLabel: 'Do it',
      accept: () => {
        window.location.reload()
      },
  });
};

const onConfigurationUpdated = () => {
  timesheetUploadRef.value?.onConfigurationUpdate()
  configurationDialogVisible.value = false
  userConfig.value = getConfiguration()
  toast.add({ severity: 'success', summary: 'Great news', detail: 'Configuration updated', life: 4000 });
}

const onThemeUpdated = () => {
  userConfig.value = getConfiguration()
}

const getInitials = () => {
  return `${userConfig.value?.name && userConfig.value.name.length > 0 ? userConfig.value.name[0] : 'J'}${userConfig.value?.surname && userConfig.value.surname.length > 0 ? userConfig.value.surname[0] : 'D'}`
}

</script>

<template>
  <div>
    <!-- Keep this here -->
    <Toast />
    <!-- Keep this here -->

    <Menubar class="h-3rem" :model="menuItems">
      <template v-if="configured" #end>
        <div class="flex align-items-center">
          <Avatar
            v-tooltip.left="'Preferences'"
            @click="myProfileModalVisible = true"
            :label="getInitials()"
            shape="circle"
            class="cursor-pointer" />
        </div>
      </template>
    </Menubar>

    <Message v-if="!configured" :closable="false" severity="info">Not yet configured. Click on the 'Configuration' button in the menu.</Message>
    <TimesheetUploadComponent ref="timesheetUploadRef" v-else></TimesheetUploadComponent>
    <ConfirmPopup></ConfirmPopup>

    <ConfigurationModal @configuration-update-success="onConfigurationUpdated()" @close="configurationDialogVisible = false" :visible="configurationDialogVisible" />
    <MyProfileModal @theme-updated="onThemeUpdated()" @close="myProfileModalVisible = false" :visible="myProfileModalVisible"/>
  </div>
</template>

<style scoped>
</style>
