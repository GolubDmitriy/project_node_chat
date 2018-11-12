const socket = io();

Vue.component('my-component', {
	template: `<li>
		<a v-if="typeof link !== 'undefined'" :href="link">{{time()}} {{name}}: {{text}}</a>
			<template v-else>{{time()}} {{name}}: {{text}}</template>
		</li>`,
	props:["text", "name", "link", "time"]
});

new Vue({
  el: '#app',
  data: {
	message: '',
    messages: [],
	users: [],
	user: {
		name: '',
		room: '',
	}
  },
  methods: {
    sendMessage() {
		const message = {
			text: this.message,
			name: this.user.name,
			id: this.user.id
		}

      socket.emit('message:create', message, err => {
		if (err) {
			console.error(err);
        } else {
			this.message = ''
        }
      })
    },
    initializeConnection() {
		socket.on('users:update', users => {
			this.users = [...users];
		})
		
		socket.on('message:joinChat', (message, data) => {
			message.link = message.link.replace('ZAG', this.user.name)
			this.messages.push(message);
		});
		
		socket.on('message:new', message => {
			this.messages.push(message);
			
			scrollToBottom(this.$refs.messages);
		})
		
		scrollToBottom(this.$refs.messages);
    },
	getTime() {
		const date = new Date();
		var hours = String(date.getHours());
		var minutes = String(date.getMinutes());
		if (hours.length === 1) hours = '0' + hours;
		if (minutes.length === 1) minutes = '0' + minutes;
		return `[${hours}:${minutes}]`;
	},
	invite() {
		socket.emit('message:invite', this.user);
	}
  },
  created() {
		const params = window.location.search.split('&');
		const name = params[0].split('=')[1].replace('+', ' ');
		const room = params[1].split('=')[1].replace('+', ' ');
	  
		this.user = {name, room};
  },	
  mounted() {
	socket.emit('join', this.user, (data) => {
		if (typeof data === 'string') {
			console.error(data);
		} else {
			this.user.id = data.userId;
			this.initializeConnection();
		}
	});
  }
})

function scrollToBottom(node) {
	setTimeout(() => {
		node.scrollTop = node.scrollHeight;
	})
}
