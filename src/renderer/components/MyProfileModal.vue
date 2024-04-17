<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { UserConfigModel } from '../../models/userConfigModel';
import { ref } from 'vue';
import Dropdown from 'primevue/dropdown';
import { usePrimeVue } from 'primevue/config';
import { useConfigurationStore } from '../stores/configurationStore';

const primeVue = usePrimeVue()

const userConfig = ref<UserConfigModel | null>(null)

const { getConfiguration, updateConfiguration } = useConfigurationStore();

const selectedTheme = ref<any>({})
const previousTheme = ref('lara-dark-blue')

const onDialogShow = () => {
  const configuration = getConfiguration()
  userConfig.value = {
    ...configuration,
    theme: configuration.theme && configuration.theme.trim().length > 0 ? configuration.theme : 'lara-dark-blue'
  }
  const selectedThemeIndex = themes.findIndex(f => f.name === userConfig.value!.theme)
  selectedTheme.value = themes[selectedThemeIndex]
  previousTheme.value = themes[selectedThemeIndex].name
}

const emit = defineEmits(['close', 'theme-updated'])

defineProps<{
  visible: boolean
}>()

const themes = [
  { name: 'md-light-indigo', themeLink: 'themes/md-light-indigo/theme.css' },
  { name: 'md-light-deeppurple', themeLink: 'themes/md-light-deeppurple/theme.css' },
  { name: 'md-dark-indigo', themeLink: 'themes/md-dark-indigo/theme.css' },
  { name: 'md-dark-deeppurple', themeLink: 'themes/md-dark-deeppurple/theme.css' },
  { name: 'mdc-light-indigo', themeLink: 'themes/mdc-light-indigo/theme.css' },
  { name: 'mdc-light-deeppurple', themeLink: 'themes/mdc-light-deeppurple/theme.css' },
  { name: 'mdc-dark-indigo', themeLink: 'themes/mdc-dark-indigo/theme.css' },
  { name: 'mdc-dark-deeppurple', themeLink: 'themes/mdc-dark-deeppurple/theme.css' },
  { name: 'aura-light-blue', themeLink: 'themes/aura-light-blue/theme.css' },
  { name: 'aura-light-indigo', themeLink: 'themes/aura-light-indigo/theme.css' },
  { name: 'aura-light-purple', themeLink: 'themes/aura-light-purple/theme.css' },
  { name: 'aura-light-teal', themeLink: 'themes/aura-light-teal/theme.css' },
  { name: 'aura-light-green', themeLink: 'themes/aura-light-green/theme.css' },
  { name: 'aura-light-amber', themeLink: 'themes/aura-light-amber/theme.css' },
  { name: 'aura-light-cyan', themeLink: 'themes/aura-light-cyan/theme.css' },
  { name: 'aura-light-pink', themeLink: 'themes/aura-light-pink/theme.css' },
  { name: 'aura-light-lime', themeLink: 'themes/aura-light-lime/theme.css' },
  { name: 'aura-light-noir', themeLink: 'themes/aura-light-noir/theme.css' },
  { name: 'aura-dark-blue', themeLink: 'themes/aura-dark-blue/theme.css' },
  { name: 'aura-dark-indigo', themeLink: 'themes/aura-dark-indigo/theme.css' },
  { name: 'aura-dark-purple', themeLink: 'themes/aura-dark-purple/theme.css' },
  { name: 'aura-dark-teal', themeLink: 'themes/aura-dark-teal/theme.css' },
  { name: 'aura-dark-green', themeLink: 'primevue/resources/themes/aura-dark-green/theme.css' },
  { name: 'aura-dark-amber', themeLink: 'primevue/resources/themes/aura-dark-amber/theme.css' },
  { name: 'aura-dark-cyan', themeLink: 'primevue/resources/themes/aura-dark-cyan/theme.css' },
  { name: 'aura-dark-pink', themeLink: 'primevue/resources/themes/aura-dark-pink/theme.css' },
  { name: 'aura-dark-lime', themeLink: 'primevue/resources/themes/aura-dark-lime/theme.css' },
  { name: 'aura-dark-noir', themeLink: 'primevue/resources/themes/aura-dark-noir/theme.css' },
  { name: 'lara-light-blue', themeLink: 'primevue/resources/themes/lara-light-blue/theme.css' },
  { name: 'lara-light-indigo', themeLink: 'primevue/resources/themes/lara-light-indigo/theme.css' },
  { name: 'lara-light-purple', themeLink: 'primevue/resources/themes/lara-light-purple/theme.css' },
  { name: 'lara-light-teal', themeLink: 'primevue/resources/themes/lara-light-teal/theme.css' },
  { name: 'lara-light-green', themeLink: 'primevue/resources/themes/lara-light-green/theme.css' },
  { name: 'lara-light-amber', themeLink: 'primevue/resources/themes/lara-light-amber/theme.css' },
  { name: 'lara-light-cyan', themeLink: 'primevue/resources/themes/lara-light-cyan/theme.css' },
  { name: 'lara-light-pink', themeLink: 'primevue/resources/themes/lara-light-pink/theme.css' },
  { name: 'lara-dark-blue', themeLink: 'primevue/resources/themes/lara-dark-blue/theme.css' },
  { name: 'lara-dark-indigo', themeLink: 'primevue/resources/themes/lara-dark-indigo/theme.css' },
  { name: 'lara-dark-purple', themeLink: 'primevue/resources/themes/lara-dark-purple/theme.css' },
  { name: 'lara-dark-teal', themeLink: 'primevue/resources/themes/lara-dark-teal/theme.css' },
  { name: 'lara-dark-green', themeLink: 'primevue/resources/themes/lara-dark-green/theme.css' },
  { name: 'lara-dark-amber', themeLink: 'primevue/resources/themes/lara-dark-amber/theme.css' },
  { name: 'lara-dark-cyan', themeLink: 'themes/lara-dark-cyan/theme.css' },
  { name: 'lara-dark-pink', themeLink: 'themes/lara-dark-pink/theme.css' }
];

const getInitials = () => {
  return `${userConfig.value?.name && userConfig.value.name.length > 0 ? userConfig.value.name[0] : 'J'}${userConfig.value?.surname && userConfig.value.surname.length > 0 ? userConfig.value.surname[0] : 'D'}`
}

const getFullName = () => {
  return `${userConfig.value?.name && userConfig.value.name.length > 0 ? userConfig.value.name : 'John'} ${userConfig.value?.surname && userConfig.value.surname.length > 0 ? userConfig.value.surname : 'Doe'}`
}

const saveTheme = async () => {
  // TODO: Error handle this
  const updatedConfig = {
    ...userConfig.value!,
    theme: selectedTheme.value.name
  }
  await window.fileSystemAPI.setUserConfig(updatedConfig)
  updateConfiguration(updatedConfig)
  primeVue.changeTheme(previousTheme.value, selectedTheme.value.name, 'theme-link')
  previousTheme.value = selectedTheme.value.name
  emit('theme-updated')
}
</script>

<template>
  <div>
    <Dialog @show="onDialogShow()" :closable="false" :visible="visible" modal header="My Profile" :style="{ width: '25rem' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
              <Avatar :label="getInitials()" shape="circle" />
              <span class="font-bold white-space-nowrap">{{getFullName()}}</span>
          </div>
        </template>
        <span class="p-text-secondary block mb-5">Update your preferences.</span>
        <div class="flex align-items-center gap-3 mb-3">
            <label for="theme" class="font-semibold w-6rem">Theme</label>
            <Dropdown
              v-model="selectedTheme"
              optionLabel="name"
              :options="themes"
              class="w-full"
              id="theme"></Dropdown>
        </div>
        <template #footer>
            <Button label="Close" text severity="secondary" @click="$emit('close')" autofocus />
            <Button @click="saveTheme()" label="Save" autofocus />
        </template>
    </Dialog>
  </div>
</template>