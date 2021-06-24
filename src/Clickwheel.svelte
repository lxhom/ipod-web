<script>
  import ZingTouch from 'zingtouch';
  let target = document.getElementById('interaction');
  let region = new ZingTouch.Region(target);

  let last = 0;

  region.bind(target, 'rotate', e => {
    let dfo = e.detail.distanceFromOrigin
    if (dfo === 0) {
      last = 0;
    } else {
      let rotation = Math.round(dfo/45);
      if (rotation !== last) {
        console.log(rotation - last);
      }
      last = rotation
    }
  });
</script>
