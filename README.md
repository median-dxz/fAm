# fAm
Istio集成的微服务监控与管理组件

## app

包含仪表盘服务。

### 本地开发

1. 安装pnpm
2. 安装项目依赖

```bash
pnpm i # 安装依赖
pnpm run prisma:generate # 初始化prisma客户端
pnpm run prisma:migrate # 初始化数据库
```

3. 启动开发服务器

```bash
pnpm dev
```

### 部署到k8s中

1. 打包镜像

```bash
docker build -t mediandxz/fam:latest .
docker push mediandxz/fam:latest
```

2. 应用yaml配置文件

```bash
kubectl apply -f ./kube/Base.yaml
kubectl apply -f ./kube
```

3. 如果使用sqlite，复制初始数据库文件到持久卷下。其他数据库则自行参考资料更改相关配置

```bash
docker cp prisma/dev.db containerID:/var/lib/fam/fam.db
```

## strategies

包含一系列策略服务，均独立部署，详情参考对应的readme
