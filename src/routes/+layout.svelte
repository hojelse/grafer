<script>
	import '../app.css'
</script>

<nav class="w-full flex justify-between pl-5 pr-5 pt-5">
	<div>
		<a href="/">
			<button>
				Editor
			</button>
		</a>
		<a href="/explorer">
			<button>
				Explorer
			</button>
		</a>
	</div>
	<a
		href="https://github.com/hojelse/grafer"
	>
		<img src="/github.svg" alt="GitHub Logo" class="h-6" />
	</a>
</nav>
<slot />
