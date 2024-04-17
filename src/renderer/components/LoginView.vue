<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Password from 'primevue/password'
import { useAuth } from '../auth/composables'
import { useRouter } from 'vue-router'
import { UserLoginModel } from '../api/models/requestModels/UserLoginModel'
import { computed, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'

const { signIn } = useAuth()
const router = useRouter()
const toast = useToast()

const signInFormValue = ref<UserLoginModel>({
  username: '',
  password: '',
  tenantId: import.meta.env.VITE_TENANT_ID ?? ''
})
const loading = ref(false)

const rules = computed(() => {
  return {
    username: { required },
    password: { required }
  }
})

const v$ = useVuelidate(rules, signInFormValue)

const submitForm = async () => {
  v$.value.$validate()

  if (v$.value.$error) {
    return
  }
  loading.value = true
  const response = await signIn(
    signInFormValue.value
  )
  loading.value = false
  if (!response) {
    toast.add({ severity: 'error', summary: 'Oops!', detail: 'Unknown error occurred', life: 3000 })
  } else if (response.verified) {
    router.push({ name: 'Dashboard' })
  } else {
    toast.add({ severity: 'warn', summary: 'Invalid login', detail: 'Could not verify your credentials, please try again', life: 3000 })
  }
}
</script>

<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <div class="text-900 text-5xl font-bold mb-3">Welcome!</div>
                        <span class="text-600 font-medium">Log in to continue</span>
                    </div>

                    <div>
                        <label for="username" class="block text-900 text-xl font-medium mb-2">Username</label>
                        <InputText :class="{ 'p-invalid': v$.username.$error }" name="username" v-model="signInFormValue.username" id="username" type="text" placeholder="Username" class="w-full md:w-30rem mb-5" />

                        <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
                        <Password :class="{ 'p-invalid': v$.password.$error }" name="password" v-model="signInFormValue.password" :feedback="false" id="password1" placeholder="Password" :toggleMask="true" class="w-full mb-3" inputClass="w-full"></Password>

                        <Button @click="submitForm" :loading="loading" label="Log In" class="w-full p-3 mt-3 text-l"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
