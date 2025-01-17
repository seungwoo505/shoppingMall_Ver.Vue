import router from '@/router';
import {createStore} from 'vuex';

const store = createStore({
    state: {
        //로그인에 필요한 변수
        userId : "",
        nickname : "",
        session : "",
        sessionTime : 0,
        loginOrNot : false,
        admin : 0
    },

    mutations : {
        loginStateChange(state, payload) {
            state.loginOrNot = payload;
        },
        
        async signUp(state, payload){
            try {
                const response = await fetch("https://seungwoo.i234.me:3333/signUp", {
                    method : "POST",
                    headers : { "Content-Type" : "application/json"},
                    body : JSON.stringify(payload)
                });

                const data = await response.json();

                alert(data.message);
                return data.success;
            }catch (err){
                alert("서버와 통신 중 오류가 발생했습니다.");
                return false;
            }
        },

        async login(state, payload){
            try{
                const response = await fetch("https://seungwoo.i234.me:3333/login", {
                    method : "POST",
                    headers : { "Content-Type" : "application/json"},
                    body : JSON.stringify(payload)
                });
        
                const data = await response.json();
                
                if(data.success){
                    state.userId = payload.userId;
                    state.nickname = data.nickname;
                    state.session = data.session;
                    state.admin = data.admin;
                    state.sessionTime = 3600;
                    state.loginOrNot = true;
                }

                alert(data.message);

                return data.success;
        
            }catch(err){
                alert("서버와 통신 중 오류가 발생했습니다.");
                return false;
            }
        },

        async logout(state){
            try {
                const response = await fetch("https://seungwoo.i234.me:3333/logout", {
                    method : "POST",
                    headers : {"Content-Type" : "application/json"},
                    body : JSON.stringify({ userId : state.userId, session : state.session})
                });

                const data = await response.json();

                if(data.success) {
                    state.userId = "";
                    state.session = "";
                    state.sessionTime = 0;
                    state.loginOrNot = false;
                    router.push("/");
                }

                alert(data.message);
                return data.success;
            } catch (err) {
                alert("서버와 통신 중 오류가 발생했습니다.");
                return false;
            }
        }
    },

    actions : {
        checkSession(state) {
            state.payload = 3600;
        }
    }
});

export default store;