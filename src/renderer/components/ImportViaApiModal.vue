<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useConfigurationStore } from '../stores/configurationStore';
import { computed, ref } from 'vue';
import RadioButton from 'primevue/radiobutton';
import Calendar from 'primevue/calendar';
import { useDateHelper } from '../../helper/dateHelper';
import { useToast } from 'primevue/usetoast';
import { HttpRequestResult } from '../../models/httpRequestResult';
import { TimeTrackerRawRecordModel } from '../../models/timeTrackerRawRecordModel';
import BlockUI from 'primevue/blockui';

const toast = useToast();

const loading = ref(false)

const { formatIso, addSomeDays, setTime } = useDateHelper()

const { getConfiguration } = useConfigurationStore();

const dates = ref([new Date(), new Date()]);

const selectedDateType = ref('Today');

const dateTypes = ref([
  { name: 'Today', key: 'T' },
  { name: 'Yesterday', key: 'Y' },
  { name: 'Previous Week', key: 'P' },
  { name: 'Custom', key: 'C' }
]);

defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['close', 'records-imported'])

const userConfig = computed(() => {
  return getConfiguration()
})

const onTypeChange = () => {
  if (selectedDateType.value === 'Today') {
    dates.value = [new Date(), new Date()]
    return
  }
  if (selectedDateType.value === 'Yesterday') {
    const yesterday = addSomeDays(new Date(), -1)
    dates.value = [yesterday, yesterday]
    return
  }
  if (selectedDateType.value === 'Previous Week') {
    dates.value = [addSomeDays(new Date(), -6), new Date()]
    return
  }
}

const importFromApi = async (from: string, to: string) => {
  let result:HttpRequestResult<Array<TimeTrackerRawRecordModel>> = {
    data: [],
    success: false
  }

  if (userConfig.value.timeTracker === 'clockify') {
    result = await window.httpApi.getClockifyTimeEntries(userConfig.value, from, to)
  } else if (userConfig.value.timeTracker === 'toggl') {
    result = await window.httpApi.getTogglTimeEntries(userConfig.value, from, to)
  }

  if (!result.success) {
    toast.add({ severity: 'error', summary: 'Oops!', detail: 'Could not import records from your timetracker :( Please validate your API Token', life: 5000 });
  } else {
    emit('records-imported', result.data ?? [])
  }
}

const importFromApiClick = async () => {
  if (dates.value.length  < 2) {
    return
  }

  if (!dates.value[dates.value.length - 1]) {
    dates.value[dates.value.length - 1] = dates.value[0]
  }

  const from = formatIso(setTime(dates.value[0], 0, 0, 0))
  const to = formatIso(setTime(dates.value[dates.value.length - 1], 23, 59, 59))

  loading.value = true
  await importFromApi(from, to)
  loading.value = false
}

const onDateSelect = (date: Date) => {
  selectedDateType.value = 'Custom'
}
</script>

<template>
  <div>
    <Dialog :closable="false" :visible="visible" modal class="w-6" :header="`Import timesheet via API (${userConfig?.timeTracker})`">
      <BlockUI :blocked="loading" class="p-2">
        <div class="card flex justify-content-start">
          <div class="flex flex-column gap-3">
              <div v-for="dateType in dateTypes" :key="dateType.key" class="flex align-items-center">
                  <RadioButton @change="onTypeChange()" v-model="selectedDateType" :inputId="dateType.key" name="dynamic" :value="dateType.name" />
                  <label :for="dateType.key" class="ml-2">{{ dateType.name }}</label>
              </div>
          </div>
        </div>
        <div class="card flex justify-content-center mt-3">
          <Calendar @date-select="onDateSelect" v-model="dates" selectionMode="range" inline :manualInput="false" />
        </div>
        <div class="flex justify-content-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="$emit('close')"></Button>
            <Button @click="importFromApiClick()" label="Import" autofocus :loading="loading" />
        </div>
      </BlockUI>
    </Dialog>
  </div>
</template>