---
title: Towers of Hanoi in Scala
date: 2015-01-15
---

Here’s a [rough solution](https://gist.github.com/cjavdev/5bd2f6b0400d96f201da) if you want to fork and play around.

I love building little games when first playing with new programming languages. For Scala I decided to write up this little game of [Towers of Hanoi](http://en.wikipedia.org/wiki/Tower_of_Hanoi).

The most difficult part was definitely moving disks from one tower to another. Because Scala is both object oriented and functional, I could have stored the state of the towers with disks as mutable variables and modified these collections when moving a disk from one tower to another. However, I’m trying really hard to embrace the immutable data structure and functional side of Scala. Check out my Move method:

```scala
def Move(from: Int, to: Int, towers: List[List[Int]]): List[List[Int]] = {
  if(!CanMove(from, to, towers)) {
    println("Can't move there")
    return towers
  }

  val disk = towers(from).head
  var i = 0;
  towers.foldLeft(List[List[Int]]())((r, l) =>
    if (i == from) {
      i += 1;
      r ::: List(l.tail);
    } else if (i == to) {
      i+= 1;
      r ::: List(List(disk) ::: l);
    } else {
      i+= 1;
      r ::: List(l);
    }
  )
}
```

It starts off with a guard clause returning the same towers state if the attempted move was illegal. Then I, store off the value of the disk `towers(from).head` so that I can use that to construct a new list later. Then I use #foldLeft on the towers List to construct a new immutable `List[List[Int]]` that has the updated state with from towers top disk removed and to towers disk added.

I’m not sure this is the best solution, and I’m super new to functional programming, so please if you have any suggestions please hit me up!
