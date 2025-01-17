<template>
    <div class="login-container" v-if="!store.state.loginOrNot">
        <h1>로그인</h1>

        <form @submit.prevent="handleLogin">
            <div>
                <label for="userId">아이디 : </label>
                <input v-model="form.userId" id="userId" type="text" required/>
            </div>

            <div>
                <label for="password">비밀번호 : </label>
                <input v-model="form.password" id="password" type="password" required/>
            </div>

            <button type="submit">로그인</button>
        </form>
        <router-link to="/sign">회원가입</router-link> 
    </div>
    <div v-else-if="store.state.loginOrNot">
        <h1>{{`${store.state.nickname}님 안녕하세요`}}</h1>
        <button @click="handleLogout">로그아웃</button>
    </div>
</template>

<script setup lang="js">
import { reactive } from 'vue';
import {v4 as uuidv4} from 'uuid';
import { useStore } from 'vuex';

const form = reactive({
    userId : "",
    password : "",
    session : ""
});

const store = useStore();

const handleLogin = async () => {
    if(form.userId === ""){
        alert("아이디를 입력해주세요.");
        return;
    }

    if(form.password === ""){
        alert("비밀번호를 입력해주세요.");
        return;
    }

    form.session = uuidv4();

    const login = store.commit("login", form);
    
    if(login) store.commit("loginStateChange", true);
};

const handleLogout = () => {
    const logout = store.commit("logout");

    if(logout) store.commit("loginStateChange", false);
};

</script>

<style lang="css" scoped>
.login-container {
    max-width: 400px;
    margin: auto;
    padding: 1em;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.login-container > h1{
    text-align: center;
}

.login-container > form > div{
    margin-bottom: 1em;
}

.login-container > form > div > label {
    display: block;
    margin-bottom: 0.5em;
}

.login-container > form > div > input {
    width: 100%;
    padding: 0.5em;
}

.login-container > form > button {
    width: 100%;
    padding: 0.7em;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.login-container > form > button:hover {
    background-color: #218838;
}
</style>