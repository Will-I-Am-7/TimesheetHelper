<script lang="ts" setup>
import Message from 'primevue/message';
import { computed, onMounted, ref } from 'vue';
import ProcessCsvRecordService from '../../services/processCsvRecordsService'
import ProcessApiRecordsService from '../../services/processApiRecordsService'
import { UserConfigModel } from '../../models/userConfigModel';
import TimesheetComponent from './TimesheetComponent.vue';
import { TimeSheetRecordModel } from '../../models/timesheetRecordModel';
import { useConfigurationStore } from '../stores/configurationStore';
import ImportViaApiModal from './ImportViaApiModal.vue'
import { TimeTrackerRawRecordModel } from '../../models/timeTrackerRawRecordModel';
import { ProcessRecordsResult } from '../../models/processRecordsResult';

const { getConfiguration } = useConfigurationStore();

const userConfig = ref<UserConfigModel | null>(null)

const isApiImport = ref(false)

const recordProcessError = ref<string | null>(null)
const processedRecords = ref<Array<TimeSheetRecordModel>>([])
const importViaApiVisible = ref(false)

const apiImportConfigured = computed(() =>
  (userConfig.value?.timeTrackerApiToken && userConfig.value?.timeTrackerApiToken.trim().length > 0))

const dialogOpen = ref(false)

const processCsvService = new ProcessCsvRecordService();
const processApiService = new ProcessApiRecordsService();

const rawFileRecords = ref<Array<any> | null>(null);

const processRecords = () => {
  let result: ProcessRecordsResult | null = null
  if (isApiImport.value) {
    result = processApiService.process(rawFileRecords.value! as TimeTrackerRawRecordModel[])
  } else {
    result = processCsvService.process(userConfig.value!.timeTracker, rawFileRecords.value!)
  }

  if (!result.success) {
    recordProcessError.value = `Processing of timesheet failed. Please try again and make sure the CSV file is correct. (Remember: export the DETAILED export!)`
  } else {
    recordProcessError.value = null
    processedRecords.value = result.data!
  }
}

const processRawRecords = () => {
  if (rawFileRecords.value && rawFileRecords.value.length > 0) {
    processRecords()
  } else {
    recordProcessError.value = null
  }
}

const onFileIconClick = () => {
  dialogOpen.value = true
  window.fileSystemAPI.retrieveCsvFileContents().then((data) => {
    dialogOpen.value = false
    rawFileRecords.value = data
    isApiImport.value = false
    processRawRecords()
  })
}

const onImportClick = () => {
  importViaApiVisible.value = true
}

const onConfigurationUpdate = () => {
  userConfig.value = getConfiguration()
}

const recordsImportedFromApi = (records: TimeTrackerRawRecordModel[]) => {
  importViaApiVisible.value = false
  rawFileRecords.value = records
  isApiImport.value = true
  processRawRecords()
}

defineExpose({
  onConfigurationUpdate
});

onMounted(() => {
  userConfig.value = getConfiguration()
})
</script>

<template>
  <div>
    <Message :closable="false" v-if="rawFileRecords && rawFileRecords.length === 0" severity="secondary">No time entries found. Please try again...</Message>
    <Message :closable="false" v-if="recordProcessError" severity="error">{{ recordProcessError }}</Message>
    <div v-if="!processedRecords || processedRecords.length === 0" class="absolute bottom-0 right-0 mb-2 mr-3 font-italic">
      <div class="text-400">"Making timesheets great again"</div>
    </div>
    <div
      v-if="!rawFileRecords || rawFileRecords.length === 0 || recordProcessError"
      class="flex justify-content-center flex-wrap align-items-center" style="height: calc(100vh - 4rem)">
      <div>
        <div @click="onFileIconClick()" class="mr-4 flex flex-column flex-wrap gap-3 cursor-pointer">
          <div class="flex justify-content-center text-500">
            <i class="pi pi-file" style="font-size: 8rem;"></i>
          </div>
          <div class="font-bold flex justify-content-center text-400">
            <p>Click to import CSV file</p>
          </div>
        </div>
      </div>
      <div v-if="apiImportConfigured" @click="onImportClick()" class="ml-4 flex flex-column flex-wrap gap-3 cursor-pointer">
        <div class="flex justify-content-center text-500">
          <i class="pi pi-cloud-upload" style="font-size: 8rem;"></i>
        </div>
        <div class="font-bold flex justify-content-center text-400">
          <p>Click to import via API</p>
        </div>
      </div>
    </div>
    <TimesheetComponent v-else :records="processedRecords">
    </TimesheetComponent>
    <ImportViaApiModal :visible="importViaApiVisible" @close="importViaApiVisible = false" @records-imported="recordsImportedFromApi">

    </ImportViaApiModal>
  </div>
</template>../../services/processCsvRecordsService