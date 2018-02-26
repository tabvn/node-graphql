# node-graphql MVC Node.js Graphql for backend api service.
## Features
  * Realtime support
  * Auto generate model when extends a base Model.
  * ACL Support
  * Token support both in Header and Query URL.
## Development

``` 
npm run dev

```

* Graphiql Browse http://127.0.0.1/api?auth=TOKEN_ID 

## Deployment
 ```
 npm run build
 ```
## Permission override in Custom Model

```
/**
     * permission
     */
    permissions() {

        return [
            {
                accessType: '*',
                role: 'everyone',
                permission: 'DENY'
            },
            {
                accessType: '*',
                role: 'administrator',
                permission: 'ALLOW'
            },
            {
                accessType: 'findById',
                role: 'owner',
                permission: 'ALLOW'
            },
            {
                accessType: 'updateById',
                role: 'owner',
                permission: 'ALLOW'
            },
        ];
    }


```


## Hooks

before_update(), after_update(), before_create(),after_create(), before_delete(), after_delete() ....
 
## Video

https://www.youtube.com/watch?v=0F8ujKCfZ2k
