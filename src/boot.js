import {rootUser} from "./config";
import _ from 'lodash'

export default (ctx) => {

    const role = ctx.models.role;
    const user = ctx.models.user;


    // create default role
    role.findOne({name: 'administrator'}).then((model) => {


        if (model === null) {
            // create default administrator role
            role.create({name: 'administrator'}).then((roleModel) => {

                user.findOne({email: rootUser.email}, null).then(userModel => {
                    if (userModel === null) {
                        // let create default user
                        user.collection.insertOne(rootUser, (err, info) => {

                            if (err) {
                                console.log(err);
                            } else {
                                ctx.models.user_role.create({
                                    userId: rootUser._id,
                                    roleId: roleModel._id,
                                }).then(() => {
                                    user.cacheSet(_.get(rootUser._id), rootUser);
                                });


                            }

                        });
                    }
                }).catch((err) => {
                    console.log("An error create default user", err);
                });

            }).catch((err) => {
                console.log("An error create default role", err);
            });

        }
    });


}