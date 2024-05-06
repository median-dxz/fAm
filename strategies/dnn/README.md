# fAm test Strategy

测试用策略服务，使用DNN对CPU使用的资源量进行预测，返回

> CPU = model(SvcTag, ResponseTime) * (1 + LimitRate)