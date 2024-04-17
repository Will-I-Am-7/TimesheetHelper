<script setup lang="ts">
import { TimeSheetRecordModel } from '../../models/timesheetRecordModel';
import DataTable from 'primevue/datatable';
import Fieldset from 'primevue/fieldset';
import { UserConfigModel } from '../../models/userConfigModel';
import { Ref, onMounted, ref } from 'vue';
import { groupBy } from 'lodash';
import { useDateHelper } from '../../helper/dateHelper';
import Column from 'primevue/column';
import { cloneDeep } from 'lodash';
import Badge from 'primevue/badge';
import OverlayPanel from 'primevue/overlaypanel';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { TpTimePostModel } from '../../models/tpTimePostModel';
import Skeleton from 'primevue/skeleton';
import { HttpRequestResult } from '../../models/httpRequestResult';
import { useToast } from 'primevue/usetoast';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import InputSwitch from 'primevue/inputswitch';
import Panel from 'primevue/panel';
import { useConfigurationStore } from '../stores/configurationStore';

const { getConfiguration } = useConfigurationStore();

const toast = useToast();

const confirm = useConfirm();

const { prettifyDate, formatStandardDate, parseDate } = useDateHelper()

const props = defineProps<{
  records: Array<TimeSheetRecordModel>
}>()

const userConfig = ref({} as UserConfigModel)

// All records, not grouped
const allRecords: Ref<Array<TimeSheetRecordModel>> = ref([])
// Records grouped by date and further grouped by description
const groupedRecords = ref<any>({})
const dates: Ref<Array<string>> = ref([])
const aggregateRecordCount = ref(0)
const singleRecordErrors = ref<Array<string>>([])

// Grouped by date
const selectedRecords = ref<any>({})
const selectAll = ref<any>({})
const loading = ref<any>({})
const expandedRows = ref<any>({});

const overlayPanel = ref()

onMounted(() => {
  userConfig.value = getConfiguration()

  allRecords.value = cloneDeep(props.records)

  // Group the records by date
  groupedRecords.value = groupBy(allRecords.value, s => s.startDate ? formatStandardDate(s.startDate) : 'No Date Found')
  dates.value = Object.keys(groupedRecords.value)

  // Further group records by description (within the date grouping)
  dates.value.forEach((date: string) => {
    loading.value[date] = false
    selectAll.value[date] = false
    selectedRecords.value[date] = []
    expandedRows.value[date] = []

    const aggregateRecords: Array<TimeSheetRecordModel> = []
    const dateRecords = groupedRecords.value[date]

    // Group by description and then targetprocess number (I do this simply by concatenating the strings)
    const descriptionGroupings = groupBy(dateRecords, (s: TimeSheetRecordModel) =>
      `${s.description && s.description.trim().length > 0 ? s.description : 'No Description'}
       ${s.targetProcessNumber ?? 'No TP number'}`)

    Object.keys(descriptionGroupings).forEach((description: string) => {
      const descriptionRecords = descriptionGroupings[description]

      let aggregatedHours = 0
      let aggregateTpNumber:number | null | undefined = null

      // There are scenarios where one item in the group does not have hours, but the other does
      // in that case, we don't want to list the error, because it is grouped.
      // Same may be true of the other error types
      // Rule is: as soon as one record in the group does not have error, the AGGREGATE does not have errors
      let noAggregateErrors = false
      descriptionRecords.forEach((descriptionRecord: TimeSheetRecordModel) => {
        if (!aggregateTpNumber && (descriptionRecord.targetProcessNumber ?? 0) > 0) {
          aggregateTpNumber = descriptionRecord.targetProcessNumber
        }
        if (!noAggregateErrors && (descriptionRecord.errors?.length ?? 0) === 0) {
          noAggregateErrors = true
        }
        aggregatedHours += (descriptionRecord.durationDecimal ?? 0)
      })

      const aggregatedRecord:TimeSheetRecordModel = {
        ...descriptionRecords[0],
        errors: noAggregateErrors ? [] : descriptionRecords[0].errors,
        durationDecimal: Math.round((aggregatedHours + Number.EPSILON) * 100) / 100,
        recordsInAggregate: descriptionRecords.length,
        targetProcessNumber: aggregateTpNumber
      }
      aggregateRecords.push(aggregatedRecord)
      if ((aggregatedRecord.errors?.length ?? 0) === 0) {
        selectedRecords.value[date].push(aggregatedRecord)
      }
    })

    groupedRecords.value[date] = aggregateRecords
    aggregateRecordCount.value += aggregateRecords.length
  });
})

const getRecordsForDate = (date: string) => {
  // Records are also grouped by description
  return groupedRecords.value[date]
}

const tableLegend = (date: string) => {
  if (date === 'No Date Found') {
    return 'No Date Found'
  }
  return prettifyDate(parseDate(date, 'yyyy-MM-dd'))
}

const errorsOnClick = (event: any, errors: Array<string>) => {
  overlayPanel.value.toggle(event);
  singleRecordErrors.value = errors;
}

const getTargetProcessLink = (tpNumber: number) => {
  return `https://sig001.tpondemand.com/entity/${tpNumber}`
}

const targetProcessNumberClick = (tpNumber: number) => {
  window.electronAPI.openExternalBrowser(getTargetProcessLink(tpNumber))
}

const onCellEditComplete = (event: any, date: string) => {
  let { data, newValue, field } = event;
  data[field] = newValue;

  if (field === 'description') {
    const errorIndex = data.errors?.indexOf('No description')
    if (!newValue || newValue.trim().length === 0) {
      if (errorIndex === -1) {
        const selectedIndex = selectedRecords.value[date].findIndex((f: TimeSheetRecordModel) => f === data)
        if (selectedIndex > -1) {
          selectedRecords.value[date].splice(selectedIndex, 1)
        }
        data.errors?.push('No description')
      }
    } else {
      if (errorIndex > -1) {
        data.errors?.splice(errorIndex, 1)
      }
    }
    return
  }

  if (field === 'targetProcessNumber') {
    const errorIndex = data.errors?.indexOf('No target process number')
    if (!newValue || newValue <= 0) {
      if (errorIndex === -1) {
        const selectedIndex = selectedRecords.value[date].findIndex((f: TimeSheetRecordModel) => f === data)
        if (selectedIndex > -1) {
          selectedRecords.value[date].splice(selectedIndex, 1)
        }
        data.errors?.push('No target process number')
      }
    } else {
      if (errorIndex > -1) {
        data.errors?.splice(errorIndex, 1)
      }
    }
  }

  if (field === 'durationDecimal') {
    const errorIndex = data.errors?.indexOf('No decimal hours')
    if (!newValue || newValue <= 0) {
      data[field] = 0; // incase it is empty or null
      if (errorIndex === -1) {
        const selectedIndex = selectedRecords.value[date].findIndex((f: TimeSheetRecordModel) => f === data)
        if (selectedIndex > -1) {
          selectedRecords.value[date].splice(selectedIndex, 1)
        }
        data.errors?.push('No decimal hours')
      }
    } else {
      if (errorIndex > -1) {
        data.errors?.splice(errorIndex, 1)
      }
    }
  }
};

const rowSelected = (date: string, record: TimeSheetRecordModel) => {
  return selectedRecords.value[date].includes(record, 0)
}

const onRecordChecked = (date: string, record: TimeSheetRecordModel) => {
  const index = selectedRecords.value[date].findIndex((f: TimeSheetRecordModel) => f === record)
  if (index < 0) {
    selectedRecords.value[date].push(record)
  } else {
    selectedRecords.value[date].splice(index, 1)
  }
}

const onSelectAll = (date: string) => {
  selectedRecords.value[date] = []
  if (selectAll.value[date]) {
    groupedRecords.value[date].forEach((f: TimeSheetRecordModel)  => {
      if ((f.errors?.length ?? 0) === 0) {
        selectedRecords.value[date].push(f)
      }
    })
  }
}

const sendRecordsToTargetProcess = async (date: string) => {
  const recordsToSend = selectedRecords.value[date]
  const mappedRecordsToSend = recordsToSend.map((record: TimeSheetRecordModel) => {
    return {
      Assignable: {
        Id: record.targetProcessNumber
      },
      Description: record.description,
      Spent: record.durationDecimal,
      Date: formatStandardDate(record.startDate!),
      Invoiceable: (record.billable ?? false) ? 'Invoiceable' : 'Non-Invoiceable'
    } as TpTimePostModel
  })

  const url = 'v1/Times'
  loading.value[date] = true
  const result = await window.httpApi.postTimeRecords({...userConfig.value}, url, mappedRecordsToSend)
  loading.value[date] = false

  result.forEach((f: HttpRequestResult<TpTimePostModel>) => {
    const recordIndex = groupedRecords.value[date].findIndex((record: TimeSheetRecordModel) =>
      record.description === f.data?.Description && record.targetProcessNumber === f.data?.Assignable.Id)
    if (recordIndex > -1) {
      groupedRecords.value[date][recordIndex].syncedSuccess = f.success
    }
  })

  const successCount = result.filter(f => f.success).length
  const failCount = result.filter(f => !f.success).length
  const message = `${successCount} records were successful. ${failCount} records failed.`
  toast.add({ severity: 'info', summary: 'Records sent to target process', detail: message});
}

const requireConfirmation = (date: string) => {
  const recordsToSend = selectedRecords.value[date]
  confirm.require({
      group: 'headless',
      header: 'Are you sure?',
      message: `You are about to send ${recordsToSend.length} record(s) to TP for ${prettifyDate(parseDate(date, 'yyyy-MM-dd'))}. This cannot be undone!`,
      accept: () => {
        sendRecordsToTargetProcess(date)
      }
  });
};

const getSyncedTooltip = (record: TimeSheetRecordModel): string => {
  if (record.syncedSuccess === undefined || record.syncedSuccess === null) {
    return 'Not yet synced :O'
  }
  if (!record.syncedSuccess) {
    return 'Record sync failed :('
  }
  return 'Record synced successfully :)'
}

const getSyncedClasses = (record: TimeSheetRecordModel): string => {
  if (record.syncedSuccess === undefined || record.syncedSuccess === null) {
    return 'pi pi-minus-circle text-yellow-500'
  }
  if (!record.syncedSuccess) {
    return 'pi pi-times-circle text-red-500'
  }
  return 'pi pi-check-circle text-green-500'
}

// TODO: This gives a warning and I have no idea why
const rowClassHook = (record: TimeSheetRecordModel) => {
  if (record.syncedSuccess !== undefined && record.syncedSuccess !== null) {
    return 'opacity-50'
  }
  return ''
}

const totalHours = (date: string) => {
  let total = 0;
  groupedRecords.value[date].forEach((record: TimeSheetRecordModel) => {
    total += record.durationDecimal ?? 0
  })
  return `${Math.round((total + Number.EPSILON) * 100) / 100}`
}

const totalSelectedHours = (date: string) => {
  let total = 0;
  selectedRecords.value[date].forEach((record: TimeSheetRecordModel) => {
    total += record.durationDecimal ?? 0
  })
  return `${Math.round((total + Number.EPSILON) * 100) / 100}`
}
</script>

<template>
  <div class="flex flex-column">
    <Fieldset
      :legend="`${userConfig.timeTracker} Timesheet import`"
      class="mt-3 mb-8">
      <div class="mb-2">
          {{`${records.length} total record(s) found`}}
      </div>
      <div class="mb-2">
          {{`${dates.length} day(s)`}}
      </div>
      <div class="m-0">
          {{`${aggregateRecordCount} grouped records`}}
      </div>
    </Fieldset>
    <Panel
      v-for="date in dates"
      class="mb-6"
      :header="tableLegend(date)">
      <DataTable
        :expanded-rows="expandedRows[date]"
        frozen
        scrollable
        :row-class="rowClassHook"
        @cell-edit-complete="onCellEditComplete($event, date)"
        editMode="cell"
        :value="getRecordsForDate(date)">
        <Column expander style="min-width:3rem" />
        <Column frozen style="min-width: 3rem">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #header class="flex justify-content-end">
            <Checkbox :disabled="loading[date]" @change="onSelectAll(date)" :binary="true" v-model="selectAll[date]"></Checkbox>
          </template>
          <template #body="{ data }">
            <Checkbox
              :disabled="data.errors?.length > 0"
              @change="onRecordChecked(date, data)"
              :model-value="rowSelected(date, data)"
              :binary="true" />
          </template>
        </Column>
        <Column frozen field="targetProcessNumber" header="TP Number" style="min-width: 12rem;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #editor="{ data, field }">
            <InputNumber class="w-full" v-model="data[field]" autofocus :useGrouping="false" />
          </template>
          <template #body="{ data }">
            <p
              v-if="data.targetProcessNumber"
              class="cursor-pointer text-primary p-0 m-0">
              {{data.targetProcessNumber}}
            </p>
          </template>
        </Column>
        <Column field="description" header="Description" style="min-width: 20rem">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #editor="{ data, field }">
            <InputText class="w-full" v-model="data[field]" autofocus />
          </template>
        </Column>
        <Column field="durationDecimal" header="Duration (decimal)" style="min-width: 10rem; text-align: left;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #editor="{ data, field }">
            <InputNumber
              mode="decimal"
              class="w-full"
              v-model="data[field]"
              :maxFractionDigits="2"
              autofocus
              :useGrouping="false" />
          </template>
        </Column>
        <Column field="billable" header="Invoiceable" style="min-width: 5rem; text-align: left;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #body="{ data }">
            <InputSwitch
              style="transform: scale(0.8);"
              class="text-xs"
              v-model="data.billable">
           </InputSwitch>
          </template>
        </Column>
        <Column field="errors" header="Errors" style="min-width: 5rem; text-align: left;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #body="{ data }">
            <Badge
              class="cursor-pointer"
              @click="errorsOnClick($event, data.errors!)"
              v-if="data.errors?.length > 0"
              :value="data.errors?.length"
              severity="danger" side="large">
            </Badge>
            <Badge
              v-else
              :value="data.errors?.length"
              severity="success" side="large">
            </Badge>
          </template>
        </Column>
        <Column class="w-3rem" header="Synced" style="min-width: 5rem; text-align: left;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #body="{ data }">
            <i
              v-tooltip.bottom="{value: getSyncedTooltip(data)}"
              :class="getSyncedClasses(data)"></i>
          </template>
        </Column>
        <Column style="min-width: 5rem; text-align: right;">
          <template v-if="loading[date]" #body>
            <Skeleton></Skeleton>
          </template>
          <template #body="{ data }">
            <i
              v-tooltip.bottom="{value: getTargetProcessLink(data.targetProcessNumber), autoHide: false}"
              @click="targetProcessNumberClick(data.targetProcessNumber)"
              v-if="(data.targetProcessNumber ?? 0) > 0"
              class="pi pi-external-link cursor-pointer"></i>
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column footer="Total selected hours:" :colspan="4" footerStyle="text-align:right" />
            <Column :footer="totalSelectedHours(date)" footerStyle="text-align:left" />
          </Row>
          <Row>
            <Column footer="Total hours:" :colspan="4" footerStyle="text-align:right" />
            <Column :footer="totalHours(date)" footerStyle="text-align:left" />
          </Row>
        </ColumnGroup>
        <template #expansion="slotProps">
          <div class="p-3">
            <div
              v-if="slotProps.data.project && slotProps.data.project.trim().length > 0"
              class="col-10">
              Project: {{slotProps.data.project}}
            </div>
            <div
              v-if="slotProps.data.tags && slotProps.data.tags.trim().length > 0"
              class="col-10">
              Tags: {{slotProps.data.tags}}
            </div>
          </div>
        </template>
      </DataTable>
      <div class="flex justify-content-end mt-5">
        <Button
          :loading="loading[date]"
          @click="requireConfirmation(date)"
          :disabled="date === 'No Date Found' || selectedRecords[date].length === 0"
          label="Send to target process"/>
      </div>
    </Panel>
    <OverlayPanel ref="overlayPanel">
      <div class="flex flex-column gap-1 w-25rem">
        <div v-for="error in singleRecordErrors">
          -> {{error}}
        </div>
      </div>
    </OverlayPanel>
    <ConfirmDialog group="headless">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="flex flex-column align-items-center p-5 surface-overlay border-round">
                <div class="border-circle bg-primary inline-flex justify-content-center align-items-center h-6rem w-6rem -mt-8">
                    <i class="pi pi-question text-5xl"></i>
                </div>
                <span class="font-bold text-2xl block mb-2 mt-4">{{ message.header }}</span>
                <p class="mb-0">{{ message.message }}</p>
                <div class="flex align-items-center gap-2 mt-4">
                    <Button label="Cancel" outlined @click="rejectCallback"></Button>
                    <Button label="Do It!" @click="acceptCallback"></Button>
                </div>
            </div>
        </template>
    </ConfirmDialog>
  </div>
</template>