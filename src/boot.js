import {rootUser} from "./config";
import _ from 'lodash'

export default async (ctx) => {

    const role = ctx.models.role;
    const user = ctx.models.user;


    let administratorRole = await ctx.models.role.findOne({name: 'administrator'});
    let defaultUser = await ctx.models.user.findOne({email: rootUser.email});

    if(administratorRole === null){
        // create role
        administratorRole = await ctx.models.role.create({name: 'administrator'});
    }
    if(administratorRole && defaultUser === null){
        // create default user;

        defaultUser = await ctx.models.user.collection.insertOne(rootUser);
        defaultUser = rootUser;
        if(defaultUser){
            ctx.models.user_role.create({
                userId: defaultUser._id,
                roleId: administratorRole._id,
            }).then(() => {


            })
        }
        
    }



}