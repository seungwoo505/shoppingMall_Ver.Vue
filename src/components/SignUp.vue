<template>
    <div class = "signup-container">
        <h1>회원가입</h1>
        <form @submit.prevent="handleSignUp">
            <div>
                <label for="userId">Id : </label>
                <input v-model="form.userId" id="userId" type="text" required/>
            </div>

            <div>
                <label for="password">password : </label>
                <input v-model="form.password" id="password" type="password" required/>
            </div>

            <div>
                <label for="nickname">별명 : </label>
                <input v-model="form.nickname" id="nickname" type="text" required/>
            </div>

            <div>
                <label for="email">email : </label>
                <input v-model="form.email" id="email" type="text" required/>
            </div>
            <button type="submit" :disabled="isLoading">{{ isLoading ? "가입중..." : "가입하기" }}</button>
            <button @click="cencle">취소</button>
        </form>
    </div>
</template>

<script setup lang="js">
import router from '@/router';
import { reactive, ref } from 'vue';
import { useStore } from 'vuex';

const form = reactive({
    userId : "",
    password : "",
    nickname : "",
    email : ""
});

const store = useStore();

const isLoading = ref(false);

const handleSignUp = async () => {
    if(form.userId === "" || form.password === "" || form.nickname === "" || form.email === ""){
        alert("입력을 안한 항목이 있습니다.");
        return;
    }

    isLoading.value = true;

    const signUp = store.commit("signUp", form);

    isLoading.value = false;

    if(signUp) router.push("/");


};

const cencle = () => {
    router.push("/");
};



</script>

<style lang="css" scoped>
.signup-container {
    max-width: 400px;
    margin: auto;
    padding: 1em;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.signup-container > h1 {
    text-align: center;
}

.signup-container > form > div {
    margin-bottom: 1em;
}

.signup-container > form > div > label{
    display: block;
    margin-bottom: 0.5em;
}

.signup-container > form > div > input {
    width: 100%;
    padding: 0.5em;
    box-sizing: border-box;
}

.signup-container > form > button{
    width: 100%;
    padding: 0.7em;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.signup-container > form > button:hover{
    background-color: #0056b3;
}
</style>