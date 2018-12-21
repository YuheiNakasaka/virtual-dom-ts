import { View, h } from "./view";
import { ActionTree } from "./action";
import { App } from "./app";

type State = typeof state;
type Actions = typeof actions;

const state = {
  count: 1
};

const actions: ActionTree<State> = {
  increment: (state: State) => {
    state.count++;
  }
};

const view: View<State, Actions> = (state, actions) => {
  return h(
    "div",
    { class: "hoge" },
    h("p", { class: "foo" }, state.count),
    h(
      "button",
      { type: "button", onclick: () => actions.increment(state) },
      "count up"
    )
  );
};

new App<State, Actions>({
  el: "#app",
  state,
  view,
  actions
});
