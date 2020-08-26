import {oncePerServices, missingService} from '../../common/services/index'

const PREFIX = '';

export default oncePerServices(function (services) {
  
  const graphqlBuilderSchema = require('../../common/graphql/LevelBuilder.schema');
  
  const resolvers = require('./resolvers').default(services);
  
  return async function builder(args) {
    
    graphqlBuilderSchema.build_options(args);
    const { parentLevelBuilder, typeDefs, builderContext } = args;
    
    typeDefs.push(`
      type ${PREFIX}TestQueryObject {
        a: String,
        b: String
      }
    
      type ${PREFIX}TestQueryElement {
        str: String,
        int: Int,
        obj: ${PREFIX}TestQueryObject
      }
    `);

    typeDefs.push(`
      input ${PREFIX}UserFilterInput {
        name: String,
        isManager: Boolean,
        isBlocked: Boolean
      }

      type ${PREFIX}UserObject {
        id: Int,
        login: String,
        name: String,
        email: String,
        manager: Boolean,
        blocked: Boolean,
        birthday: String
      }

      input ${PREFIX}UserAuthInput {
        name: String!,
        password: String!,
      }
    `)
    
    parentLevelBuilder.addQuery({
      name: `testQuery`,
      type: `[${PREFIX}TestQueryElement]`,
      resolver: resolvers.testQuery(builderContext),
    }).addQuery({
      name: `usersQuery`,
      type: `[${PREFIX}UserObject]`,
      args: `filter: ${PREFIX}UserFilterInput`,
      resolver: resolvers.usersQuery(builderContext),
    }).addMutation({
      name: `userAuthMutation`,
      type: `String`,
      args: `input: ${PREFIX}UserAuthInput`,
      resolver: resolvers.userAuthMutation(builderContext),
    });
    
  }
});
