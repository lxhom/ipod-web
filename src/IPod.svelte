<svelte:head>
    <link href="/fa/css/solid.min.css" rel="stylesheet">
    <link href="/fa/css/fontawesome.min.css" rel="stylesheet">
</svelte:head>

<style>
    /* This is a modified version of this iPod recreation (i suck at css) https://codepen.io/DanGasson/pen/LeJBRj */

    @font-face {
        font-family: 'ChicagoFont';
        font-style: normal;
        font-weight: normal;
        src: local('ChicagoFont'), url('/Chicago.woff') format('woff');
    }

    * {
        --light-background: #FFFFFF;
        --dark-background: #E3E4E5;
        --light-screen-background: #D6D5D0;
        --dark-screen-background: #A5A59B;
        --screen-light: #C1C1BA;
        --screen-dark: #484647;
        --icon-light-grey: #BABDC1;
        --light-grey: #F2F2F2;
        --mid-grey: #999999;
        --dark-grey: #595959;
        --very-dark-grey: #4D4D4D;
    }

    .container {
        position: fixed;
    }

    .centered {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .ipod {
        width: 415px;
        height: 692px;
        border: 1px solid transparent;
        border-radius: 38px;
        background: linear-gradient(45deg, var(--dark-background), var(--light-background));
        box-shadow: inset 5px -5px 15px 0 grey;
    }

    .screen {
        position: relative;
        margin: 30px auto 0 auto;
        width: 284px;
        height: 230px;
        background: linear-gradient(135deg, var(--dark-screen-background), var(--light-screen-background));
        border-radius: 10px;
        box-shadow: inset 0 0 10px 2px var(--very-dark-grey);
        font-family: "ChicagoFont", "Arial", sans-serif;
        font-size: 130%;
        color: var(--screen-dark);
    }

    .title {
        position: absolute;
    }

    .title-bar {
        position: absolute;
        left: 5px;
        right: 5px;
        height: 16%;
    }

    .title-container {
        text-align: center;
    }

    .player-icon {
        position: absolute;
        display: inline-block;
        top: 55%;
        left: 10px;
        transform: translate(0, -50%);
        font-size: 90%;
    }

    .battery {
        position: absolute;
        right: 5px;
        height: 50px;
        width: 100px;
        background-color: var(--screen-light);
        border: 5px solid var(--screen-dark);
        transform: scale(0.3, 0.3);
        transform-origin: 100% 25%;
    }
    .battery:before {
         content: '';
         position: absolute;
         top: 50%;
         right: -12px;
         transform: translate(0, -50%);
         height: 33%;
         width: 7px;
         background-color: var(--screen-light);
         border-right: 5px solid var(--screen-dark);
         border-top: 5px solid var(--screen-dark);
         border-bottom: 5px solid var(--screen-dark);
    }
    .battery:after {
         content: '';
         position: absolute;
         top: 5px;
         bottom: 5px;
         left: 5px;
         width: 70px;
         background: repeating-linear-gradient(to right,
         var(--screen-dark), var(--screen-dark) 20px,
         var(--screen-light) 20px, var(--screen-light) 25px,
         var(--screen-dark) 25px, var(--screen-dark) 45px,
         var(--screen-light) 45px, var(--screen-light) 50px,
         var(--screen-dark) 50px, var(--screen-dark) 70px);
    }

    .menu-options {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        position: relative;
        top: 17%;
        height: 81%;
        border-top: 2px solid var(--screen-dark);
        padding-top: 3px;
    }

    .option {
        padding-left: 14px;
        transition: background-color 100ms, color 100ms;
        padding-bottom: 2px;
    }

    .option.selected {
        background-color: var(--screen-dark);
        color: var(--screen-light);
    }

</style>

<script>
    import Clickwheel from "./Clickwheel.svelte"
    let itemsStore = null, isDefault = true;
    let items = ["Playlists", "Artists", "Songs", "Settings", "About", "Now Playing"]
    let selected = 3;
    let playing = false;
    let handleWheel = e => {
      navigator.vibrate([15])
      selected += e.detail.steps;
      if (selected > items.length - 1) selected = 0;
      if (selected < 0) selected = items.length - 1;
    }
    let handleButton = e => {
      navigator.vibrate([50])
      let button = e.detail.button;
      if (button === "click") {
        if (isDefault) {
          itemsStore = items;
          items = selected === 4 ? ["Made by lxhom with Svelte & zingTouch", "URL: iPod.lxhom.codes", "Source: github.com/ lxhom/ipod-web", "Version: PB-58dee7+1"] : ["Not implemented"];
          selected = 0;
          isDefault = false;
          console.log(items)
        } else {
          items = itemsStore;
          isDefault = true
        }
      } else if (button === "playPause") {
        playing = !playing
      }
    }
</script>

<div class="container centered">
    <div class="ipod">
        <div class="screen">
            <div class="title-bar">
                <div class="title-container">
                    <div class="player-icon"><i class={"fas " + (playing ? "fa-pause" : "fa-play")}></i></div>
                    <div class="title centered">iPod</div>
                    <div class="battery small"></div>
                </div>
            </div>
            <div class="menu-options">
                {#each items.map((v, i) => ({v, i})) as item}
                    <div class="option arr" class:selected={selected === item.i}>{item.v}</div>
                {/each}
            </div>
        </div>
        <Clickwheel on:wheel={handleWheel} on:button={handleButton} />
    </div>
</div>