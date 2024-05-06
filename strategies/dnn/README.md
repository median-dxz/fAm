# fAm test Strategy

策略服务样例，使用DNN对CPU使用的资源量进行预测，返回

> CPU = model(WorkloadTag, ResponseTime) * (1 + LimitRate)

