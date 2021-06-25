<script>
  import ZingTouch from 'zingtouch';
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let angle = 45;
  let menu, fwd, pp, bck, wheel, btn;

  let rotateRegion, btnRegions = {};

  onMount(() => {
    let map = {
      menu,
      forward: fwd,
      playPause: pp,
      back: bck,
      click: btn
    }

    for (name in map) {
      (() => {
        let button = name
        let el = map[name];
        let region = new ZingTouch.Region(el);
        btnRegions[name] = {el, region}
        region.bind(el, "tap", () => {
          dispatch("button", {button})
        })
      })()
    }

    let rotateRegion = new ZingTouch.Region(wheel);

    let last = 0;
    let lastRel = 0;
    rotateRegion.bind(wheel, 'rotate', e => {
      let dfo = e.detail.distanceFromOrigin
      if (dfo === 0) {
        last = 0;
      } else {
        let rotation = Math.round((dfo-(10*lastRel))/angle);
        if (rotation !== last) {
          dispatch("wheel", {steps: rotation - last});

        }
        last = rotation
      }
    });
  });

  onDestroy(() => {
    rotateRegion?.unbind(wheel, 'rotate')
    for (name in btnRegions) {
      let {region, el} = btnRegions[name];
      region?.unbind(el, "tap")
    }
  });

</script>

<div class="outer-ring">
    <div class="menu">
        <svg viewBox="-150 5 350 350">
            <path id="curve" d="m0,30 c16,-4 32,-4 48,0" />
            <text>
                <textPath xlink:href="#curve">menu</textPath>
            </text>
        </svg>
    </div>
    <div class="skip forward"></div>
    <div class="skip back"></div>
    <div class="play-pause"></div>
    <div bind:this={wheel} class="touch-wheel centered">
        <div bind:this={btn} class="center-button centered"></div>
    </div>
    <div class="hitboxes">
        <div bind:this={menu} class="r0"></div>
        <div bind:this={fwd} class="r90"></div>
        <div bind:this={pp} class="r180"></div>
        <div bind:this={bck} class="r270"></div>
    </div>
</div>

<style>
    .centered {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .outer-ring {
        position: relative;
        margin: 0 auto;
        top: 30px;
        height: 350px;
        width: 350px;
        border-radius: 50%;
        background-color: var(--light-background);
        box-shadow: inset 5px -5px 30px -7px var(--dark-grey);
    }
    .outer-ring:before, .outer-ring:after {
                   content: '';
                   position: absolute;
                   width: 0;
                   height: 99%;
                   border: 1px solid var(--very-dark-grey);
    }
    .outer-ring:before {
         left: 50%;
         transform: rotate(45deg);
    }
    .outer-ring:after {
         top: 0;
         left: 50%;
         transform: rotate(135deg);
    }

    .touch-wheel {
        position: absolute;
        height: 276px;
        width: 276px;
        border: 2px solid var(--very-dark-grey);
        border-radius: 50%;
        background: radial-gradient(farthest-side at 90% -70%, var(--mid-grey), var(--light-grey));
        box-shadow: 5px -5px 30px -7px var(--dark-grey);
        z-index: 1;
    }

    .center-button {
        position: absolute;
        height: 100px;
        width: 100px;
        border: 2px solid var(--icon-light-grey);
        border-radius: 50%;
        background: #CBCCCE radial-gradient(farthest-side at -90% 80%, var(--mid-grey), var(--light-grey));
    }

    text {
        font-family: "Arial", serif;
        font-size: 110%;
        font-weight: bold;
        fill: var(--icon-light-grey);
    }
    path {
        fill: transparent;
    }

    .skip {
        position: absolute;
        top: 50%;
        transform: translate(0, -50%);
        background-color: var(--icon-light-grey);
        height: 12px;
        width: 4px;
    }
    .skip:before, .skip:after {
                   content: '';
                   position: absolute;
                   border-left: 9px solid var(--icon-light-grey);
                   border-top: 6px solid transparent;
                   border-bottom: 6px solid transparent;
    }
    .skip:before {
         left: -9px;
    }
    .skip:after {
         left: -18px;
    }
    .skip.forward {
        right: 7px;
    }
    .skip.back {
        left: 7px;
        transform: rotate(180deg) translate(0, 50%);
    }

    .play-pause {
        position: absolute;
        bottom: 12px;
        left: 50%;
        height: 0;
        width: 0;
        transform: translate(-13px, 0);
        border-left: 12px solid var(--icon-light-grey);
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
    }
    .play-pause:before {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 4px;
        height: 12px;
        width: 10px;
        background: repeating-linear-gradient(to right,
        var(--icon-light-grey), var(--icon-light-grey) 4px,
        transparent 4px, transparent 6px,
        var(--icon-light-grey) 6px, var(--icon-light-grey) 10px);
    }

    .hitboxes {
        width: 100%;
        height: 100%;
        top: 0;
        position: absolute;
    }

    .r0 {
        position: absolute;
        width: 100%;
        height: 50px;
    }

    .r90 {
        position: absolute;
        right: 0;
        width: 50px;
        height: 100%;
    }

    .r180 {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 50px;
    }

    .r270 {
        position: absolute;
        left: 0;
        width: 50px;
        height: 100%;
    }
</style>