import * as types from '../mutation_types';
import * as utils from '../utils';

export default {
  [types.TOGGLE_TREE_OPEN](state, tree) {
    Object.assign(tree, {
      opened: !tree.opened,
    });
  },
  [types.SET_DIRECTORY_DATA](state, { data, tree }) {
    const level = tree.level !== undefined ? tree.level + 1 : 0;
    const parentTreeUrl = data.parent_tree_url ? `${data.parent_tree_url}${data.path}` : state.endpoints.rootUrl;

    Object.assign(tree, {
      tree: [
        ...data.trees.map(t => utils.decorateData({
          ...t,
          type: 'tree',
          parentTreeUrl,
          level,
        })),
        ...data.submodules.map(m => utils.decorateData({
          ...m,
          type: 'submodule',
          parentTreeUrl,
          level,
        })),
        ...data.blobs.map(b => utils.decorateData({
          ...b,
          type: 'blob',
          parentTreeUrl,
          level,
        })),
      ],
    });
  },
  [types.SET_PARENT_TREE_URL](state, url) {
    Object.assign(state, {
      parentTreeUrl: url,
    });
  },
  [types.SET_LAST_COMMIT_URL](state, { tree = state, url }) {
    Object.assign(tree, {
      lastCommitPath: url,
    });
  },
  [types.CREATE_TMP_TREE](state, { parent, tmpEntry }) {
    parent.tree.push(tmpEntry);
  },
};
