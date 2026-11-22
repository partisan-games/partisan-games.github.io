import { MathUtils, Quaternion, Vector3 } from 'three'

const point = (x, y, z) => new Vector3(x, y, z)
const position = joint => joint.getWorldPosition(new Vector3())
const rotation = joint => joint.getWorldQuaternion(new Quaternion())

function turn(joint, worldRotation) {
  const parent = rotation(joint.parent)
  joint.quaternion.premultiply(parent.clone().invert().multiply(worldRotation).multiply(parent))
}

function aim(joint, child, target) {
  const origin = position(joint)
  const from = position(child).sub(origin).normalize()
  const to = target.clone().sub(origin).normalize()
  turn(joint, new Quaternion().setFromUnitVectors(from, to))
}

// Lay out a bent limb with the lengths of the imported bones. The pole picks the elbow or knee side.
function reach(root, joint, tip, target, pole) {
  const start = position(root)
  const a = start.distanceTo(position(joint)), b = position(joint).distanceTo(position(tip))
  const axis = target.clone().sub(start)
  const distance = MathUtils.clamp(axis.length(), Math.abs(a - b) + .001, a + b - .001)
  axis.normalize()
  const bend = pole.clone().sub(start)
  bend.addScaledVector(axis, -bend.dot(axis)).normalize()
  const along = (a * a - b * b + distance * distance) / (2 * distance)
  const elbow = start.clone().addScaledVector(axis, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, a * a - along * along)))
  aim(root, joint, elbow)
  aim(joint, tip, start.addScaledVector(axis, distance))
}

/** Fit the kneeling crew's poses once in metres, before placing either figure beside the gun. */
export function fitCrewPose(figure, loader) {
  const bone = name => figure.getObjectByName('mixamorig' + name)
  const hips = position(bone('Hips'))
  figure.position.set(-hips.x, .62 - hips.y, -hips.z)
  for (const [side, sign] of [['Left', -1], ['Right', 1]]) {
    const foot = bone(side + 'Foot'), toes = bone(side + 'ToeBase')
    const forward = (side === 'Left') === loader
    const ankle = point(sign * .15, forward ? .105 : .12, forward ? -.29 : .49)
    const knee = point(sign * .18, forward ? .48 : .055, forward ? -.50 : -.04)
    reach(bone(side + 'UpLeg'), bone(side + 'Leg'), foot, ankle, knee)
    aim(foot, toes, position(foot).add(point(0, forward ? -.075 : -.085, forward ? -.20 : .18)))
  }

  const spine = bone('Spine'), head = bone('Head')
  const moving = [spine, head]
  for (const side of ['Left', 'Right'])
    for (const part of ['Arm', 'ForeArm', 'Hand']) moving.push(bone(side + part))
  const rest = moving.map(joint => joint.quaternion.clone())
  function pose(lean, hands, glance) {
    moving.forEach((joint, i) => joint.quaternion.copy(rest[i]))
    turn(spine, new Quaternion().setFromAxisAngle(point(1, 0, 0), lean))
    turn(head, new Quaternion().setFromAxisAngle(point(1, 0, 0), glance))
    for (const [i, side] of ['Left', 'Right'].entries()) {
      const hand = bone(side + 'Hand')
      reach(bone(side + 'Arm'), bone(side + 'ForeArm'), hand, hands[i], point(i ? .42 : -.42, .81, -.10))
      aim(hand, bone(side + 'HandMiddle1'), position(hand).add(point(i ? -.04 : .04, -.02, -.11)))
    }
    return moving.map(joint => joint.quaternion.clone())
  }
  // The layer grips the wheel. The loader brings the round forward with both hands.
  const idle = pose(loader ? -.15 : -.20, loader
    ? [point(-.13, .85, -.30), point(.12, .80, -.19)]
    : [point(-.15, .77, -.42), point(.03, .67, -.47)], -.07)
  const working = pose(loader ? -.38 : -.24, loader
    ? [point(-.10, .84, -.53), point(.09, .80, -.39)]
    : [point(-.12, .70, -.46), point(.02, .78, -.45)], -.10)
  const braced = pose(.045, [point(-.18, .93, -.21), point(.14, .91, -.16)], .03)
  const blend = (charge, recoil) => {
    for (let i = 0; i < moving.length; i++)
      moving[i].quaternion.slerpQuaternions(idle[i], working[i], charge).slerp(braced[i], recoil)
  }
  blend(0, 0)
  const grips = ['Left', 'Right'].map((side, i) => ({
    arm: bone(side + 'Arm'), elbow: bone(side + 'ForeArm'), hand: bone(side + 'Hand'),
    fingers: bone(side + 'HandMiddle1'), outside: i ? .42 : -.42,
  }))
  function placeHands(left, right) {
    for (const [i, { arm, elbow, hand, fingers, outside }] of grips.entries()) {
      const goal = i ? right : left
      const pole = figure.parent.localToWorld(point(outside, .78, -.08))
      // The contact point is on the fingers, while the two-bone solver positions the wrist.
      for (let pass = 0; pass < 2; pass++) {
        const wrist = position(hand).sub(position(fingers)).add(goal)
        reach(arm, elbow, hand, wrist, pole)
      }
    }
  }
  return { blend, placeHands, chest: bone('Spine2'), left: grips[0].fingers, right: grips[1].fingers }
}
