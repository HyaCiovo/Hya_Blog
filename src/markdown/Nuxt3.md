# Nuxt3了解&踩坑

## 前言

菜鸟前端，近来没有什么业务需求，所以就想着了解一下之前没接触过的一些流行的前端技术。这一个月大概过了一遍Vue3、Next和Nuxt3。因为之前实习和现在工作积累了一些Vue2和React的使用经验，所以Vue3接受起来并不困难。Next也大致过了一遍文档，了解了一下约定式路由，跟着写了个分别实现了SSG、ISR和SSR的小demo。不过在Nuxt3这里受到了很大的阻力（踩坑），这里做一下记录，希望在方便自己复习的同时，也能帮到后面学习的同学。🤭🤭🤭



# 这里先摆一张知乎看到的图🤣

<img src="https://pic1.zhimg.com/v2-d71f5670d6b8bef77ba1faf3d9b6eaa0_xld.png" alt="img" style="zoom: 50%;" />



## 安装

```bash
# npx
npx nuxi init nuxt-app
# pnpm
pnpm dlx nuxi init nuxt-app
```

这里有坑，大概率报错🙃 （我想不少同学在这就被劝退了hh）

由于国内的GFW，这个域名受到了DNS污染，没法连接。但即使是科学上网也是大概率挂掉的。

查找原因后了解到 nuxt的脚手架 nuxi 使用了 giget 来从nuxt项目模板仓库中获取文件。

giget干的事情很简单，就是利用node从github上拉取相应仓库。实际上giget貌似是nuxt团队对另一个相似的项目degit的仿制。两者都可以用方便的命令从github拉取仓库。唯一的不同就是degit支持自动从环境变量中获取https_proxy进行代理，而giget完全没有考虑这一点😅

github上已经有人提了pr 并且开发团队已采纳 不过我在这之后安装还是会报错。

试了网上不同的解决方法，目前有用的是[nuxt3项目初始化失败 - 掘金 (juejin.cn)](https://juejin.cn/post/7154586714416087076)

直接去修改本地的hosts文件：

新增一行， `185.199.108.133 raw.githubusercontent.com`

在稳定的网络环境并且可以ping通raw.githubusercontent.com后再运行安装命令（我这里使用的是`npx`版本的命令）可以成功初始化安装Nuxt3项目文件。

issue里有提到修改DNS为 `114.114.114.114` 但我试过后没有成功。

issue里还提供了一种，安装nuxi后，去修改nuxi的文件中的proxy地址，这里作者没有尝试，有兴趣的同学可以去下面的网址参考。

[npx nuxi init nuxt3-app and download template error · Issue #3430 · nuxt/framework (github.com)](https://github.com/nuxt/framework/issues/3430)



## 获取数据

因为`Nuxt3`是`SSR`的方案，所以你可能不仅仅只是想要在浏览器端发送请求获取数据，还想在服务器端就获取到数据并渲染组件。

`Nuxt3`提供了 4 种方式使得你可以在服务器端异步获取数据

- useAsyncData
- useLazyAsyncData （useAsyncData+lazy:true）
- useFetch
- useLazyFetch （useFetch+lazy:true）

> 注意：他们只能在**`setup`**或者是`生命周期钩子`中使用

> useAsyncData/useFetch默认是服务端获取数据，但其暴露出的`refresh方法是从客户端获取数据`；
>
> 如果不想在服务端获取数据，可以在`options`里设置 `server : false` , 这样就可以在客户端获取数据；
>
> Nuxt3提供了自己的请求命令` $fetch` 但我们仍可以使用 `axios `来获取，方便我们从已有Vue3项目迁移。

踩坑记录：

- 使用useFetch获取数据时，发现在network里找不到请求信息

​	useFetch默认服务端获取数据，当然不会在客户端中获取到Fetch/XHR信息；如果想要在客户端请求，需要在	options中配置 `server : false`

- 使用useFetch的`refresh`在请求Nuxt的server中的api时正常使用，在请求本地node服务时报跨域错误

​	useAsyncData/useFetchde的 `refresh` 是客户端发出的请求，服务端请求是不会产生跨域问题的，但客户端	会产生跨域问题，开发时就需要服务端配置 *Access-Control-Allow-Origin*  或者前端项目配置proxy代理

- 在项目中配置前端代理proxy无效

​	Nuxt3文档中并未提及如何配置proxy，应该是默认了开发时跨域问题由服务端解决。网上搜索并没有很多                  	Nuxt3的博客，且大部分都不提设置proxy（难道全是前后端不分离用node做后端？），找到的几个提到proxy	的博客都是说nuxt.config.ts里支持了vite，在vite属性中配置类似之前Vite的代理方式就可以了。亲测没用👍

```ts
export default defineNuxtConfig({
  vite: {
    server: {
      open: true,
      // https: true,
      proxy: {
        "/devApi": {
          target: "http://127.0.0.1:8085/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/devApi/, ""),
        },
      },
    },
  }
})
```

​	

后面在Nuxt3的issue里发现是要在nitro属性中设置，配置后便解决了开发跨域的问题。

```ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      "/proxy": {
        target: "http://127.0.0.1:8085/",
        changeOrigin: true,
        prependPath: true,
      }
    }
  }
})
```



## Pages

Nuxt3的Pages对于Next的约定式文件路由做了大量的“借鉴”，包括动态路由的实现方式

但ta的使用体验个人觉得是不如Next13的，

嵌套路由 `Nested Router`是Nuxt3对于作者来说的一个feature，虽然目前本菜鸟还没遇到需要使用嵌套路由才能实现的业务场景😂

> 这里有个坑，中文文档嵌套路由的实现是引入 <NuxtChild /> 组件，但试了之后没有用。
>
> 看了github的issue后发现是已经修改为了 <NuxtPage />组件，中文文档并没有同步更新。





# ......

其他的本人都跟着文档敲了一遍，没有再碰到其他特别难以解决的坑了。



# 后话

遇到问题不要慌，文档查一查，博客搜一搜，isuue扒一扒，基本都能解决。

> 最好提高下自己的英语水平，因为中文文档很多不能够与官方文档保持同步更新，落后版本 === kuangkuang掉大坑🕳

![查看源图像](https://tse1-mm.cn.bing.net/th/id/OIP-C.2THtavcQEe_PIVs8A8H1PAHaE2?pid=ImgDet&rs=1)





